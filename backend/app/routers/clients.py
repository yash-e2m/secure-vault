from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import uuid

from ..database import get_db
from ..models import User, Client
from ..schemas import ClientCreate, ClientUpdate, ClientResponse
from .auth import get_current_user

router = APIRouter(prefix="/api/clients", tags=["Clients"])


def client_to_response(client: Client) -> ClientResponse:
    """Convert Client model to response schema"""
    return ClientResponse(
        id=client.id,
        name=client.name,
        description=client.description,
        logo=client.logo,
        initials=client.initials,
        color=client.color,
        credentialCount=client.credential_count,
        lastAccessed=client.last_accessed,
        createdAt=client.created_at
    )


@router.get("", response_model=List[ClientResponse])
def get_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all clients"""
    clients = db.query(Client).all()
    return [client_to_response(c) for c in clients]


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(
    client_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific client by ID"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client_to_response(client)


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
def create_client(
    client_data: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new client"""
    # Check if client with same name already exists
    existing_client = db.query(Client).filter(Client.name == client_data.name).first()
    if existing_client:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A client with this name already exists"
        )
    
    client = Client(
        id=str(uuid.uuid4()),
        name=client_data.name,
        description=client_data.description,
        logo=client_data.logo,
        initials=client_data.initials,
        color=client_data.color,
        credential_count=0,
        last_accessed=datetime.utcnow(),
        created_at=datetime.utcnow()
    )
    
    db.add(client)
    db.commit()
    db.refresh(client)
    
    return client_to_response(client)


@router.put("/{client_id}", response_model=ClientResponse)
def update_client(
    client_id: str,
    client_data: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a client"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Check if new name conflicts with existing client
    if client_data.name and client_data.name != client.name:
        existing_client = db.query(Client).filter(Client.name == client_data.name).first()
        if existing_client:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A client with this name already exists"
            )
    
    update_data = client_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(client, field, value)
    
    db.commit()
    db.refresh(client)
    
    return client_to_response(client)


@router.put("/{client_id}/access")
def update_last_accessed(
    client_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update client's last accessed timestamp"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client.last_accessed = datetime.utcnow()
    db.commit()
    
    return {"message": "Last accessed updated"}


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(
    client_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a client and all its credentials"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    db.delete(client)
    db.commit()
