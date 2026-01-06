from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime


EnvironmentType = Literal["development", "staging", "production"]
ServiceType = Literal["database", "api", "cloud", "other"]


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


class CredentialUpdate(BaseModel):
    name: Optional[str] = None
    environment: Optional[EnvironmentType] = None
    serviceType: Optional[ServiceType] = None
    username: Optional[str] = None
    password: Optional[str] = None
    url: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


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

    class Config:
        from_attributes = True
