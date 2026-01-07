from fastapi import APIRouter, Depends, HTTPException, status
from ..models import User
from ..schemas import UserResponse, PasswordChange
from ..services.auth import auth_service
from ..database import SessionLocal
from .auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user's info"""
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        avatar=current_user.avatar
    )


@router.post("/change-password")
def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user)
):
    """Change the current user's password"""
    # Verify current password
    if not auth_service.verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password length
    if len(password_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters"
        )
    
    # Hash and update the new password
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == current_user.id).first()
        user.hashed_password = auth_service.get_password_hash(password_data.new_password)
        db.commit()
        return {"message": "Password changed successfully"}
    finally:
        db.close()
