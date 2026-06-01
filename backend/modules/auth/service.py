from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.user import User
from core.security import verify_password, create_access_token


def authenticate(email: str, password: str, db: Session):
    user = db.query(User).filter(User.email == email, User.is_active == True).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos.",
        )
    token = create_access_token({"sub": str(user.id), "profile": user.profile.value})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_name": user.name,
        "user_profile": user.profile.value,
    }
