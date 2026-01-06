from sqlalchemy import Column, String, DateTime, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    logo = Column(String, nullable=True)
    initials = Column(String(5), nullable=False)
    color = Column(String(10), nullable=False)
    credential_count = Column(Integer, default=0)
    last_accessed = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship to credentials
    credentials = relationship("Credential", back_populates="client", cascade="all, delete-orphan")
