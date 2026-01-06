from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from ..database import get_db
from ..models import User, Client, Credential
from ..schemas import CredentialCreate, CredentialUpdate, CredentialResponse
from ..services.encryption import encryption_service
from .auth import get_current_user

router = APIRouter(prefix="/api/credentials", tags=["Credentials"])


def credential_to_response(cred: Credential) -> CredentialResponse:
    """Convert Credential model to response schema with decrypted values"""
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
        createdAt=cred.created_at
    )


@router.get("", response_model=List[CredentialResponse])
def get_all_credentials(
    client_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all credentials, optionally filtered by client_id"""
    query = db.query(Credential)
    if client_id:
        query = query.filter(Credential.client_id == client_id)
    
    credentials = query.all()
    return [credential_to_response(c) for c in credentials]


@router.get("/client/{client_id}", response_model=List[CredentialResponse])
def get_client_credentials(
    client_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all credentials for a specific client"""
    credentials = db.query(Credential).filter(Credential.client_id == client_id).all()
    return [credential_to_response(c) for c in credentials]


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
    return credential_to_response(cred)


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
        created_at=datetime.utcnow()
    )
    
    db.add(cred)
    
    # Update client credential count
    client.credential_count += 1
    
    db.commit()
    db.refresh(cred)
    
    return credential_to_response(cred)


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
    
    update_data = cred_data.model_dump(exclude_unset=True)
    
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
    
    return credential_to_response(cred)


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
    
    # Update client credential count
    client = db.query(Client).filter(Client.id == cred.client_id).first()
    if client and client.credential_count > 0:
        client.credential_count -= 1
    
    db.delete(cred)
    db.commit()
