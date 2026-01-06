# Credential Manager Backend

A secure credential management API built with FastAPI, SQLite, and Fernet encryption.

## Setup

1. **Create virtual environment:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Seed the database with test data:**
```bash
python -m app.seed_data
```

4. **Run the server:**
```bash
python -m uvicorn app.main:app --reload --port 8000
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| john.doe@company.com | password123 | Senior Developer |
| admin@company.com | admin123 | Administrator |
| jane.smith@company.com | jane2024! | DevOps Engineer |

## Encryption

All sensitive credential data (passwords, URLs, notes) is encrypted at rest using Fernet symmetric encryption. The encryption key is derived from the `ENCRYPTION_KEY` environment variable.
