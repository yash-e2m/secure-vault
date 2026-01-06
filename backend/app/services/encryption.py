import base64
import hashlib
from cryptography.fernet import Fernet
from ..config import ENCRYPTION_KEY


class EncryptionService:
    """Service for encrypting and decrypting sensitive credential data"""
    
    def __init__(self):
        # Derive a valid Fernet key from the config key
        # Fernet requires exactly 32 url-safe base64-encoded bytes
        key_bytes = hashlib.sha256(ENCRYPTION_KEY.encode()).digest()
        self.fernet = Fernet(base64.urlsafe_b64encode(key_bytes))
    
    def encrypt(self, data: str | None) -> str | None:
        """Encrypt a string value"""
        if data is None:
            return None
        return self.fernet.encrypt(data.encode()).decode()
    
    def decrypt(self, encrypted_data: str | None) -> str | None:
        """Decrypt an encrypted string value"""
        if encrypted_data is None:
            return None
        try:
            return self.fernet.decrypt(encrypted_data.encode()).decode()
        except Exception:
            # If decryption fails, return original (for backwards compatibility)
            return encrypted_data


# Singleton instance
encryption_service = EncryptionService()
