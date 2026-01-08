from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime


EnvironmentType = Literal["development", "staging", "production"]
ServiceType = Literal["database", "api", "cloud", "env", "other"]


class AllowedUserInfo(BaseModel):
    """Information about a user who has access to view a credential"""
    id: str
    name: str
    email: str


class CredentialCreate(BaseModel):
    clientId: str
    name: str
    environment: EnvironmentType
    serviceType: ServiceType
    username: str
    password: str
    url: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []
    allowedUserIds: Optional[List[str]] = None  # None or empty = all users (legacy mode)


class CredentialUpdate(BaseModel):
    name: Optional[str] = None
    environment: Optional[EnvironmentType] = None
    serviceType: Optional[ServiceType] = None
    username: Optional[str] = None
    password: Optional[str] = None
    url: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    allowedUserIds: Optional[List[str]] = None  # Only owner can modify this


class CredentialResponse(BaseModel):
    id: str
    clientId: str
    name: str
    environment: EnvironmentType
    serviceType: ServiceType
    username: str
    password: str  # Decrypted for response
    url: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []
    lastUpdated: datetime
    createdAt: datetime
    # Visibility fields
    ownerId: Optional[str] = None
    ownerName: Optional[str] = None
    isLegacy: bool = True
    isOwner: bool = False
    allowedUsers: List[AllowedUserInfo] = []
    viewerCount: int = 0

    class Config:
        from_attributes = True

