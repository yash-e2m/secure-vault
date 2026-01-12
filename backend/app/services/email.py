from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from ..config import (
    MAIL_USERNAME,
    MAIL_PASSWORD,
    MAIL_FROM,
    MAIL_PORT,
    MAIL_SERVER,
    MAIL_STARTTLS,
    MAIL_SSL_TLS,
    USE_CREDENTIALS,
    VALIDATE_CERTS
)

class EmailService:
    def __init__(self):
        self.conf = ConnectionConfig(
            MAIL_USERNAME=MAIL_USERNAME,
            MAIL_PASSWORD=MAIL_PASSWORD,
            MAIL_FROM=MAIL_FROM,
            MAIL_PORT=MAIL_PORT,
            MAIL_SERVER=MAIL_SERVER,
            MAIL_STARTTLS=MAIL_STARTTLS,
            MAIL_SSL_TLS=MAIL_SSL_TLS,
            USE_CREDENTIALS=USE_CREDENTIALS,
            VALIDATE_CERTS=VALIDATE_CERTS
        )
        self.fastmail = FastMail(self.conf)

    async def send_password_reset_email(self, email_to: EmailStr, token: str):
        """
        Send password reset email
        """
        reset_link = f"http://localhost:8080/reset-password?token={token}"
        
        html = f"""
        <p>You requested a password reset.</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="{reset_link}">{reset_link}</a></p>
        <p>If you did not request this, please ignore this email.</p>
        <p>This link will expire in 30 minutes.</p>
        """

        message = MessageSchema(
            subject="Password Reset Request",
            recipients=[email_to],
            body=html,
            subtype=MessageType.html
        )

        await self.fastmail.send_message(message)

    async def send_credential_shared_email(self, email_to: EmailStr, credential_name: str, sharer_name: str, credential_link: str):
        """
        Send email notification when a credential is shared
        """
        html = f"""
        <p>Hello,</p>
        <p><strong>{sharer_name}</strong> has shared a credential with you: <strong>{credential_name}</strong>.</p>
        <p>You can view it here:</p>
        <p><a href="{credential_link}">{credential_link}</a></p>
        """

        message = MessageSchema(
            subject=f"Credential Shared: {credential_name}",
            recipients=[email_to],
            body=html,
            subtype=MessageType.html
        )

        await self.fastmail.send_message(message)

email_service = EmailService()
