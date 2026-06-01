from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from .schemas import LoginRequest, TokenResponse
from .service import authenticate

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    return authenticate(body.email, body.password, db)
