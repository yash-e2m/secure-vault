import os

# Database configuration - Supabase PostgreSQL
# Use pooler connection for general use (removed pgbouncer param which psycopg2 doesn't understand)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres.mctcjubzifqyswbnpfox:Tipl%23789isthepassword@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
)

# Direct connection for migrations (bypasses connection pooler)
DIRECT_DATABASE_URL = os.getenv(
    "DIRECT_DATABASE_URL",
    "postgresql://postgres.mctcjubzifqyswbnpfox:Tipl%23789isthepassword@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
)

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production-minimum-32-chars")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days - for persistent sessions

# Encryption key for credentials (Fernet requires 32 bytes base64 encoded)
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", "your-32-byte-base64-encoded-key!")

# CORS origins
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

# Email Configuration
MAIL_USERNAME = os.getenv("MAIL_USERNAME", "221430131132@gtu.edu.in")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "kzle veja uvhx vape")
MAIL_FROM = os.getenv("MAIL_FROM", "221430131132@gtu.edu.in")
MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
MAIL_STARTTLS = True
MAIL_SSL_TLS = False
USE_CREDENTIALS = True
VALIDATE_CERTS = True
