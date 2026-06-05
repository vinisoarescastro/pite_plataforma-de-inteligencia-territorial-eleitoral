from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from database import get_db
from models.user import User, UserProfile
from dependencies import require_admin
from security import hash_password
from .schemas import UserResponse, UserCreate, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(body: UserCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
    user = User(
        id=uuid.uuid4(),
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
        profile=UserProfile(body.profile),
        candidate_name=body.candidate_name,
        can_export=body.can_export,
        can_compare=body.can_compare,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: uuid.UUID, body: UserUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    data = body.model_dump(exclude_unset=True)
    if "profile" in data and data["profile"] is not None:
        data["profile"] = UserProfile(data["profile"])
    for field, value in data.items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}/deactivate", response_model=UserResponse)
def deactivate_user(user_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user
