"""
Database Seed Script
Populates the database with dummy data for testing
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta
import uuid

from app.database import SessionLocal, engine, Base
from app.models import User, Client, Credential
from app.services.auth import auth_service
from app.services.encryption import encryption_service


def seed_database():
    """Seed the database with test data"""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Clear existing data
        db.query(Credential).delete()
        db.query(Client).delete()
        db.query(User).delete()
        db.commit()
        
        print("Creating users...")
        users = create_users(db)
        
        print("Creating clients...")
        clients = create_clients(db)
        
        print("Creating credentials...")
        create_credentials(db, clients)
        
        db.commit()
        print("\n[OK] Database seeded successfully!")
        print_test_accounts()
        
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error seeding database: {e}")
        raise
    finally:
        db.close()


def create_users(db):
    """Create test users"""
    users_data = [
        {
            "id": "user-1",
            "name": "John Doe",
            "email": "john.doe@company.com",
            "password": "password123",
            "role": "Senior Developer"
        },
        {
            "id": "user-2",
            "name": "Admin User",
            "email": "admin@company.com",
            "password": "admin123",
            "role": "Administrator"
        },
        {
            "id": "user-3",
            "name": "Jane Smith",
            "email": "jane.smith@company.com",
            "password": "jane2024!",
            "role": "DevOps Engineer"
        }
    ]
    
    users = []
    for data in users_data:
        user = User(
            id=data["id"],
            name=data["name"],
            email=data["email"],
            hashed_password=auth_service.get_password_hash(data["password"]),
            role=data["role"]
        )
        db.add(user)
        users.append(user)
    
    return users


def create_clients(db):
    """Create test clients"""
    client_colors = ['#06b6d4', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#6366f1']
    
    clients_data = [
        {
            "id": "1",
            "name": "Acme Corporation",
            "description": "E-commerce platform with multi-tenant architecture",
            "initials": "AC",
            "color": client_colors[0],
            "credential_count": 6,
            "created_days_ago": 90,
            "accessed_minutes_ago": 30
        },
        {
            "id": "2",
            "name": "TechStart Inc",
            "description": "SaaS Application for project management",
            "initials": "TS",
            "color": client_colors[1],
            "credential_count": 5,
            "created_days_ago": 60,
            "accessed_minutes_ago": 120
        },
        {
            "id": "3",
            "name": "Global Finance",
            "description": "Financial Dashboard and Analytics Platform",
            "initials": "GF",
            "color": client_colors[2],
            "credential_count": 4,
            "created_days_ago": 45,
            "accessed_minutes_ago": 1440  # 24 hours
        },
        {
            "id": "4",
            "name": "HealthCare Plus",
            "description": "Healthcare management system",
            "initials": "HC",
            "color": client_colors[3],
            "credential_count": 5,
            "created_days_ago": 30,
            "accessed_minutes_ago": 2880  # 48 hours
        }
    ]
    
    clients = []
    now = datetime.utcnow()
    
    for data in clients_data:
        client = Client(
            id=data["id"],
            name=data["name"],
            description=data["description"],
            initials=data["initials"],
            color=data["color"],
            credential_count=data["credential_count"],
            last_accessed=now - timedelta(minutes=data["accessed_minutes_ago"]),
            created_at=now - timedelta(days=data["created_days_ago"])
        )
        db.add(client)
        clients.append(client)
    
    return clients


def create_credentials(db, clients):
    """Create test credentials with encryption"""
    now = datetime.utcnow()
    
    # Acme Corporation credentials
    acme_creds = [
        {
            "id": "cred-1",
            "client_id": "1",
            "name": "PostgreSQL Production",
            "environment": "production",
            "service_type": "database",
            "username": "acme_prod_user",
            "password": "Pr0d$ecure#2024!",
            "url": "postgresql://db.acme.com:5432/production",
            "notes": "Main production database. Handle with care.",
            "tags": ["critical", "production"],
            "days_ago": 5
        },
        {
            "id": "cred-2",
            "client_id": "1",
            "name": "Stripe API Key",
            "environment": "production",
            "service_type": "api",
            "username": "sk_live_acme",
            "password": "sk_live_51Hb2e8K9xxxxxxxxxxxxx",
            "url": "https://dashboard.stripe.com",
            "notes": "Production Stripe keys for payment processing",
            "tags": ["payments", "api"],
            "days_ago": 10
        },
        {
            "id": "cred-3",
            "client_id": "1",
            "name": "AWS Console",
            "environment": "production",
            "service_type": "cloud",
            "username": "acme-admin@aws.com",
            "password": "AWS@cme2024!Secure",
            "url": "https://acme.signin.aws.amazon.com/console",
            "notes": "AWS root account access",
            "tags": ["cloud", "aws", "critical"],
            "days_ago": 2
        },
        {
            "id": "cred-4",
            "client_id": "1",
            "name": "PostgreSQL Staging",
            "environment": "staging",
            "service_type": "database",
            "username": "acme_staging_user",
            "password": "St@g1ng#2024",
            "url": "postgresql://staging.acme.com:5432/staging",
            "notes": None,
            "tags": ["staging", "database"],
            "days_ago": 15
        },
        {
            "id": "cred-5",
            "client_id": "1",
            "name": "SendGrid API",
            "environment": "production",
            "service_type": "api",
            "username": "acme-mail",
            "password": "SG.xxxxx.yyyyy",
            "url": "https://app.sendgrid.com",
            "notes": "Email service for transactional emails",
            "tags": ["email", "api"],
            "days_ago": 20
        },
        {
            "id": "cred-6",
            "client_id": "1",
            "name": "MongoDB Development",
            "environment": "development",
            "service_type": "database",
            "username": "dev_user",
            "password": "dev123!@#",
            "url": "mongodb://localhost:27017/acme_dev",
            "notes": None,
            "tags": ["development", "local"],
            "days_ago": 1
        }
    ]
    
    # TechStart Inc credentials
    techstart_creds = [
        {
            "id": "cred-7",
            "client_id": "2",
            "name": "MongoDB Atlas Production",
            "environment": "production",
            "service_type": "database",
            "username": "techstart_prod",
            "password": "M0ng0@tl@s#Pr0d",
            "url": "mongodb+srv://cluster.mongodb.net/techstart",
            "notes": None,
            "tags": ["database", "production"],
            "days_ago": 3
        },
        {
            "id": "cred-8",
            "client_id": "2",
            "name": "Azure DevOps",
            "environment": "production",
            "service_type": "cloud",
            "username": "techstart-admin@azure.com",
            "password": "Azure@DevOps2024!",
            "url": "https://dev.azure.com/techstart",
            "notes": None,
            "tags": ["cloud", "devops"],
            "days_ago": 7
        },
        {
            "id": "cred-9",
            "client_id": "2",
            "name": "Twilio API",
            "environment": "production",
            "service_type": "api",
            "username": "ACxxxxxxxxxxxxxx",
            "password": "auth_token_xxxxx",
            "url": "https://console.twilio.com",
            "notes": "SMS and voice services",
            "tags": ["sms", "api"],
            "days_ago": 12
        },
        {
            "id": "cred-10",
            "client_id": "2",
            "name": "Redis Cloud",
            "environment": "staging",
            "service_type": "database",
            "username": "techstart-redis",
            "password": "Redis#Cl0ud2024",
            "url": "redis://redis.techstart.com:6379",
            "notes": None,
            "tags": ["cache", "staging"],
            "days_ago": 8
        },
        {
            "id": "cred-11",
            "client_id": "2",
            "name": "GitHub Enterprise",
            "environment": "production",
            "service_type": "other",
            "username": "techstart-bot",
            "password": "ghp_xxxxxxxxxxxxxx",
            "url": "https://github.com/techstart",
            "notes": None,
            "tags": ["git", "ci-cd"],
            "days_ago": 2
        }
    ]
    
    # Global Finance credentials
    gf_creds = [
        {
            "id": "cred-12",
            "client_id": "3",
            "name": "Oracle Database",
            "environment": "production",
            "service_type": "database",
            "username": "gf_prod_admin",
            "password": "0r@cl3#F1n@nce!",
            "url": "oracle://db.globalfinance.com:1521/FINDB",
            "notes": "Financial data warehouse",
            "tags": ["database", "critical", "financial"],
            "days_ago": 4
        },
        {
            "id": "cred-13",
            "client_id": "3",
            "name": "GCP Service Account",
            "environment": "production",
            "service_type": "cloud",
            "username": "gf-analytics@gcp.com",
            "password": '{"type":"service_account","project_id":"global-finance"}',
            "url": "https://console.cloud.google.com",
            "notes": None,
            "tags": ["cloud", "gcp", "analytics"],
            "days_ago": 6
        },
        {
            "id": "cred-14",
            "client_id": "3",
            "name": "Plaid API",
            "environment": "production",
            "service_type": "api",
            "username": "client_id_xxxxx",
            "password": "secret_xxxxx",
            "url": "https://dashboard.plaid.com",
            "notes": "Banking data aggregation",
            "tags": ["api", "banking", "financial"],
            "days_ago": 9
        },
        {
            "id": "cred-15",
            "client_id": "3",
            "name": "PostgreSQL Staging",
            "environment": "staging",
            "service_type": "database",
            "username": "gf_staging",
            "password": "Stag1ng#GF2024",
            "url": "postgresql://staging.globalfinance.com:5432/staging",
            "notes": None,
            "tags": ["database", "staging"],
            "days_ago": 11
        }
    ]
    
    # HealthCare Plus credentials
    hc_creds = [
        {
            "id": "cred-16",
            "client_id": "4",
            "name": "PostgreSQL HIPAA",
            "environment": "production",
            "service_type": "database",
            "username": "hc_hipaa_admin",
            "password": "H1P@@#S3cur3!2024",
            "url": "postgresql://hipaa.healthcare.com:5432/main",
            "notes": "HIPAA compliant database - encrypted at rest",
            "tags": ["database", "hipaa", "critical"],
            "days_ago": 2
        },
        {
            "id": "cred-17",
            "client_id": "4",
            "name": "AWS HealthLake",
            "environment": "production",
            "service_type": "cloud",
            "username": "healthlake-admin",
            "password": "AWS#H3@lthL@ke!",
            "url": "https://healthlake.aws.amazon.com",
            "notes": None,
            "tags": ["cloud", "aws", "hipaa"],
            "days_ago": 5
        },
        {
            "id": "cred-18",
            "client_id": "4",
            "name": "Zoom Healthcare API",
            "environment": "production",
            "service_type": "api",
            "username": "api_key_xxxxx",
            "password": "api_secret_xxxxx",
            "url": "https://marketplace.zoom.us",
            "notes": "Telehealth video integration",
            "tags": ["api", "video", "telehealth"],
            "days_ago": 8
        },
        {
            "id": "cred-19",
            "client_id": "4",
            "name": "MongoDB Dev",
            "environment": "development",
            "service_type": "database",
            "username": "hc_dev",
            "password": "DevL0cal#123",
            "url": "mongodb://localhost:27017/healthcare_dev",
            "notes": None,
            "tags": ["database", "development"],
            "days_ago": 1
        },
        {
            "id": "cred-20",
            "client_id": "4",
            "name": "DocuSign Integration",
            "environment": "production",
            "service_type": "api",
            "username": "integrator_key_xxx",
            "password": "api_password_xxx",
            "url": "https://admin.docusign.com",
            "notes": "Patient consent forms",
            "tags": ["api", "documents"],
            "days_ago": 3
        }
    ]
    
    all_creds = acme_creds + techstart_creds + gf_creds + hc_creds
    
    for data in all_creds:
        cred = Credential(
            id=data["id"],
            client_id=data["client_id"],
            name=data["name"],
            environment=data["environment"],
            service_type=data["service_type"],
            username=data["username"],
            encrypted_password=encryption_service.encrypt(data["password"]),
            encrypted_url=encryption_service.encrypt(data["url"]) if data.get("url") else None,
            encrypted_notes=encryption_service.encrypt(data["notes"]) if data.get("notes") else None,
            tags=data["tags"],
            last_updated=now - timedelta(days=data["days_ago"]),
            created_at=now - timedelta(days=data["days_ago"] + 10)
        )
        db.add(cred)


def print_test_accounts():
    """Print test account information"""
    print("\n" + "="*60)
    print("TEST ACCOUNTS FOR LOGIN")
    print("="*60)
    print("\n| Email                      | Password     | Role             |")
    print("|----------------------------|--------------|------------------|")
    print("| john.doe@company.com       | password123  | Senior Developer |")
    print("| admin@company.com          | admin123     | Administrator    |")
    print("| jane.smith@company.com     | jane2024!    | DevOps Engineer  |")
    print("\n" + "="*60)


if __name__ == "__main__":
    seed_database()
