from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime
import uuid

from ..database import get_db
from ..models import User, Client, Credential, CredentialViewer
from ..schemas import CredentialCreate, CredentialUpdate, CredentialResponse, AllowedUserInfo
from ..services.encryption import encryption_service
from .auth import get_current_user

router = APIRouter(prefix="/api/credentials", tags=["Credentials"])


def can_user_view_credential(cred: Credential, user_id: str, db: Session) -> bool:
    """Check if a user has permission to view a credential"""
    # Legacy credentials are visible to everyone
    if cred.is_legacy:
        return True
    
    # Owner can always view
    if cred.owner_id == user_id:
        return True
    
    # Check if user is in the viewers list
    viewer = db.query(CredentialViewer).filter(
        CredentialViewer.credential_id == cred.id,
        CredentialViewer.user_id == user_id
    ).first()
    
    return viewer is not None


def credential_to_response(cred: Credential, current_user: User, db: Session) -> CredentialResponse:
    """Convert Credential model to response schema with decrypted values and visibility info"""
    # Get allowed users
    allowed_users = []
    viewer_count = 0
    
    if not cred.is_legacy:
        viewers = db.query(CredentialViewer).filter(
            CredentialViewer.credential_id == cred.id
        ).all()
        viewer_count = len(viewers)
        
        for viewer in viewers:
            user = db.query(User).filter(User.id == viewer.user_id).first()
            if user:
                allowed_users.append(AllowedUserInfo(
                    id=user.id,
                    name=user.name,
                    email=user.email
                ))
    
    # Get owner name
    owner_name = None
    if cred.owner_id:
        owner = db.query(User).filter(User.id == cred.owner_id).first()
        if owner:
            owner_name = owner.name
    
    return CredentialResponse(
        id=cred.id,
        clientId=cred.client_id,
        name=cred.name,
        environment=cred.environment,
        serviceType=cred.service_type,
        username=cred.username,
        password=encryption_service.decrypt(cred.encrypted_password) or "",
        url=encryption_service.decrypt(cred.encrypted_url),
        notes=encryption_service.decrypt(cred.encrypted_notes),
        tags=cred.tags or [],
        lastUpdated=cred.last_updated,
        createdAt=cred.created_at,
        ownerId=cred.owner_id,
        ownerName=owner_name,
        isLegacy=cred.is_legacy if cred.is_legacy is not None else True,
        isOwner=cred.owner_id == current_user.id if cred.owner_id else False,
        allowedUsers=allowed_users,
        viewerCount=viewer_count
    )


def filter_visible_credentials(credentials: List[Credential], user_id: str, db: Session) -> List[Credential]:
    """Filter credentials to only those the user can view"""
    return [cred for cred in credentials if can_user_view_credential(cred, user_id, db)]


@router.get("", response_model=List[CredentialResponse])
def get_all_credentials(
    client_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all credentials the user has access to, optionally filtered by client_id"""
    query = db.query(Credential)
    if client_id:
        query = query.filter(Credential.client_id == client_id)
    
    all_credentials = query.all()
    visible_credentials = filter_visible_credentials(all_credentials, current_user.id, db)
    return [credential_to_response(c, current_user, db) for c in visible_credentials]


@router.get("/client/{client_id}", response_model=List[CredentialResponse])
def get_client_credentials(
    client_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all credentials for a specific client that the user has access to"""
    all_credentials = db.query(Credential).filter(Credential.client_id == client_id).all()
    visible_credentials = filter_visible_credentials(all_credentials, current_user.id, db)
    return [credential_to_response(c, current_user, db) for c in visible_credentials]


@router.get("/{credential_id}", response_model=CredentialResponse)
def get_credential(
    credential_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific credential by ID"""
    cred = db.query(Credential).filter(Credential.id == credential_id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
    
    # Check access
    if not can_user_view_credential(cred, current_user.id, db):
        raise HTTPException(status_code=403, detail="You don't have permission to view this credential")
    
    return credential_to_response(cred, current_user, db)


@router.post("", response_model=CredentialResponse, status_code=status.HTTP_201_CREATED)
def create_credential(
    cred_data: CredentialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new credential with encrypted sensitive fields"""
    # Verify client exists
    client = db.query(Client).filter(Client.id == cred_data.clientId).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Determine if this is a legacy credential (no specific users selected)
    is_legacy = (cred_data.allowedUserIds is None or len(cred_data.allowedUserIds) == 0)
    
    cred = Credential(
        id=str(uuid.uuid4()),
        client_id=cred_data.clientId,
        name=cred_data.name,
        environment=cred_data.environment,
        service_type=cred_data.serviceType,
        username=cred_data.username,
        encrypted_password=encryption_service.encrypt(cred_data.password),
        encrypted_url=encryption_service.encrypt(cred_data.url) if cred_data.url else None,
        encrypted_notes=encryption_service.encrypt(cred_data.notes) if cred_data.notes else None,
        tags=cred_data.tags,
        last_updated=datetime.utcnow(),
        created_at=datetime.utcnow(),
        owner_id=current_user.id,
        is_legacy=is_legacy
    )
    
    db.add(cred)
    
    # Create viewer entries if specific users are selected
    if not is_legacy and cred_data.allowedUserIds:
        for user_id in cred_data.allowedUserIds:
            # Verify user exists
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                viewer = CredentialViewer(
                    id=str(uuid.uuid4()),
                    credential_id=cred.id,
                    user_id=user_id,
                    created_at=datetime.utcnow()
                )
                db.add(viewer)
    
    # Update client credential count
    client.credential_count += 1
    
    db.commit()
    db.refresh(cred)
    
    return credential_to_response(cred, current_user, db)


@router.put("/{credential_id}", response_model=CredentialResponse)
def update_credential(
    credential_id: str,
    cred_data: CredentialUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a credential"""
    cred = db.query(Credential).filter(Credential.id == credential_id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
    
    # Check if user can view this credential
    if not can_user_view_credential(cred, current_user.id, db):
        raise HTTPException(status_code=403, detail="You don't have permission to access this credential")
    
    update_data = cred_data.model_dump(exclude_unset=True)
    
    # Handle allowedUserIds update - only owner can modify (or anyone for legacy without owner)
    if "allowedUserIds" in update_data:
        # For legacy credentials without owner, anyone can update and becomes the owner
        if cred.owner_id is not None and cred.owner_id != current_user.id:
            raise HTTPException(
                status_code=403, 
                detail="Only the owner can modify who has access to this credential"
            )
        
        allowed_user_ids = update_data.pop("allowedUserIds")
        
        if allowed_user_ids is None or len(allowed_user_ids) == 0:
            # Convert to legacy (visible to all)
            cred.is_legacy = True
            # Remove all existing viewers
            db.query(CredentialViewer).filter(
                CredentialViewer.credential_id == cred.id
            ).delete()
        else:
            # Update to restricted access
            cred.is_legacy = False
            # Set owner if not already set
            if cred.owner_id is None:
                cred.owner_id = current_user.id
            # Remove existing viewers
            db.query(CredentialViewer).filter(
                CredentialViewer.credential_id == cred.id
            ).delete()
            # Add new viewers
            for user_id in allowed_user_ids:
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    viewer = CredentialViewer(
                        id=str(uuid.uuid4()),
                        credential_id=cred.id,
                        user_id=user_id,
                        created_at=datetime.utcnow()
                    )
                    db.add(viewer)
    
    # Handle field name mapping and encryption
    for field, value in update_data.items():
        if field == "password" and value is not None:
            cred.encrypted_password = encryption_service.encrypt(value)
        elif field == "url":
            cred.encrypted_url = encryption_service.encrypt(value) if value else None
        elif field == "notes":
            cred.encrypted_notes = encryption_service.encrypt(value) if value else None
        elif field == "serviceType":
            cred.service_type = value
        elif field == "clientId":
            cred.client_id = value
        else:
            setattr(cred, field, value)
    
    cred.last_updated = datetime.utcnow()
    db.commit()
    db.refresh(cred)
    
    return credential_to_response(cred, current_user, db)


@router.put("/{credential_id}/visibility", response_model=CredentialResponse)
def update_credential_visibility(
    credential_id: str,
    allowed_user_ids: List[str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update who can view a credential - only owner can do this"""
    cred = db.query(Credential).filter(Credential.id == credential_id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
    
    # Only owner can modify visibility
    if cred.owner_id != current_user.id:
        raise HTTPException(
            status_code=403, 
            detail="Only the owner can modify who has access to this credential"
        )
    
    if len(allowed_user_ids) == 0:
        # Convert to legacy (visible to all)
        cred.is_legacy = True
        db.query(CredentialViewer).filter(
            CredentialViewer.credential_id == cred.id
        ).delete()
    else:
        # Update to restricted access
        cred.is_legacy = False
        # Remove existing viewers
        db.query(CredentialViewer).filter(
            CredentialViewer.credential_id == cred.id
        ).delete()
        # Add new viewers
        for user_id in allowed_user_ids:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                viewer = CredentialViewer(
                    id=str(uuid.uuid4()),
                    credential_id=cred.id,
                    user_id=user_id,
                    created_at=datetime.utcnow()
                )
                db.add(viewer)
    
    cred.last_updated = datetime.utcnow()
    db.commit()
    db.refresh(cred)
    
    return credential_to_response(cred, current_user, db)


@router.delete("/{credential_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_credential(
    credential_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a credential"""
    cred = db.query(Credential).filter(Credential.id == credential_id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
    
    # Check access - only owner or legacy credentials can be deleted by anyone
    if not cred.is_legacy and cred.owner_id != current_user.id:
        raise HTTPException(
            status_code=403, 
            detail="Only the owner can delete this credential"
        )
    
    # Update client credential count
    client = db.query(Client).filter(Client.id == cred.client_id).first()
    if client and client.credential_count > 0:
        client.credential_count -= 1
    
    db.delete(cred)
    db.commit()
