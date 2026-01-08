"""
Database migration script for Supabase PostgreSQL
Creates all tables if they don't exist and adds new columns
"""
from sqlalchemy import create_engine, text
from app.config import DIRECT_DATABASE_URL
from app.database import Base
from app.models import User, Client, Credential, CredentialViewer

def run_migrations():
    """Create all tables in the database"""
    print("Connecting to Supabase PostgreSQL...")
    
    # Use direct connection for migrations (bypasses pgbouncer)
    engine = create_engine(DIRECT_DATABASE_URL, echo=True)
    
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    print("\n[OK] All tables created successfully!")
    
    # Add new columns to existing credentials table if they don't exist
    print("\nChecking for new columns in credentials table...")
    with engine.connect() as conn:
        # Check if owner_id column exists
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'credentials' AND column_name = 'owner_id'
        """))
        if not result.fetchone():
            print("Adding owner_id column...")
            conn.execute(text("ALTER TABLE credentials ADD COLUMN owner_id VARCHAR REFERENCES users(id)"))
            conn.commit()
            print("[OK] owner_id column added")
        else:
            print("[OK] owner_id column already exists")
        
        # Check if is_legacy column exists
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'credentials' AND column_name = 'is_legacy'
        """))
        if not result.fetchone():
            print("Adding is_legacy column with default TRUE...")
            conn.execute(text("ALTER TABLE credentials ADD COLUMN is_legacy BOOLEAN DEFAULT TRUE"))
            conn.commit()
            print("[OK] is_legacy column added - existing credentials are set as legacy (visible to all)")
        else:
            print("[OK] is_legacy column already exists")
    
    # List created tables
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        """))
        tables = [row[0] for row in result]
        print(f"\nTables in database: {', '.join(tables)}")

if __name__ == "__main__":
    run_migrations()
