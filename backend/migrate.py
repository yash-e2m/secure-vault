"""
Database migration script for Supabase PostgreSQL
Creates all tables if they don't exist
"""
from sqlalchemy import create_engine, text
from app.config import DIRECT_DATABASE_URL
from app.database import Base
from app.models import User, Client, Credential

def run_migrations():
    """Create all tables in the database"""
    print("Connecting to Supabase PostgreSQL...")
    
    # Use direct connection for migrations (bypasses pgbouncer)
    engine = create_engine(DIRECT_DATABASE_URL, echo=True)
    
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    print("\n[OK] All tables created successfully!")
    
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
