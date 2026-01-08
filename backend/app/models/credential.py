from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Credential(Base):
    __tablename__ = "credentials"

    id = Column(String, primary_key=True, index=True)
    client_id = Column(String, ForeignKey("clients.id"), nullable=False)
    name = Column(String, nullable=False)
    environment = Column(String, nullable=False)  # 'development' | 'staging' | 'production'
    service_type = Column(String, nullable=False)  # 'database' | 'api' | 'cloud' | 'env' | 'other'
    username = Column(String, nullable=False)
    
    # Encrypted fields
    encrypted_password = Column(String, nullable=False)
    encrypted_url = Column(String, nullable=True)
    encrypted_notes = Column(String, nullable=True)
    
    tags = Column(JSON, default=list)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Ownership and visibility fields
    owner_id = Column(String, ForeignKey("users.id"), nullable=True)  # Nullable for legacy credentials
    is_legacy = Column(Boolean, default=True)  # True = visible to all, False = restricted

    # Relationships
    client = relationship("Client", back_populates="credentials")
    owner = relationship("User", foreign_keys=[owner_id])
    viewers = relationship("CredentialViewer", back_populates="credential", cascade="all, delete-orphan")

