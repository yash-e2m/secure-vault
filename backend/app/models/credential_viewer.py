from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class CredentialViewer(Base):
    """Model for tracking which users can view specific credentials"""
    __tablename__ = "credential_viewers"

    id = Column(String, primary_key=True, index=True)
    credential_id = Column(String, ForeignKey("credentials.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    credential = relationship("Credential", back_populates="viewers")
    user = relationship("User")
