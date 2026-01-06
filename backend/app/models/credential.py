from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Credential(Base):
    __tablename__ = "credentials"

    id = Column(String, primary_key=True, index=True)
    client_id = Column(String, ForeignKey("clients.id"), nullable=False)
    name = Column(String, nullable=False)
    environment = Column(String, nullable=False)  # 'development' | 'staging' | 'production'
    service_type = Column(String, nullable=False)  # 'database' | 'api' | 'cloud' | 'other'
    username = Column(String, nullable=False)
    
    # Encrypted fields
    encrypted_password = Column(String, nullable=False)
    encrypted_url = Column(String, nullable=True)
    encrypted_notes = Column(String, nullable=True)
    
    tags = Column(JSON, default=list)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship to client
    client = relationship("Client", back_populates="credentials")
