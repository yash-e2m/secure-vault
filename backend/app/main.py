from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS
from .database import Base, engine
from .routers import auth_router, users_router, clients_router, credentials_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Credential Manager API",
    description="Secure credential management system with encrypted storage",
    version="1.0.0"
)

# Configure CORS - must be added before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(clients_router)
app.include_router(credentials_router)


@app.get("/")
def root():
    return {"message": "Credential Manager API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
