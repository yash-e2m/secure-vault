from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ClientCreate(BaseModel):
    name: str
    description: Optional[str] = None
    logo: Optional[str] = None
    initials: str
    color: str


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo: Optional[str] = None
    initials: Optional[str] = None
    color: Optional[str] = None


class ClientResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    logo: Optional[str] = None
    initials: str
    color: str
    credentialCount: int
    lastAccessed: datetime
    createdAt: datetime

    class Config:
        from_attributes = True
