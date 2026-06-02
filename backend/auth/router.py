# Rotas (endpoints) de autenticação.
# APIRouter agrupa rotas relacionadas — aqui, tudo que começa com /auth.

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from .schemas import LoginRequest, TokenResponse
from .service import authenticate

# prefix="/auth" faz todas as rotas aqui começarem com /auth
# tags=["auth"] agrupa no Swagger UI em http://localhost:8000/docs
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """
    Endpoint de login: POST /auth/login
    Recebe e-mail e senha, devolve um token JWT se as credenciais estiverem corretas.
    """
    return authenticate(body.email, body.password, db)
