# Lógica de autenticação: verifica e-mail, senha e retorna o token JWT.

from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.user import User
from security import verify_password, create_access_token


def authenticate(email: str, password: str, db: Session):
    """
    Tenta autenticar o usuário.
    1. Busca o usuário pelo e-mail (só usuários ativos)
    2. Verifica se a senha bate com o hash no banco
    3. Se tudo certo, gera e retorna um token JWT
    4. Se algo errar, lança HTTP 401 (Unauthorized)
    """
    # Busca o usuário no banco. filter() é equivalente a WHERE no SQL.
    user = db.query(User).filter(User.email == email, User.is_active == True).first()

    # Se não encontrou o usuário OU a senha está errada, nega o acesso
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos.",
        )

    # Cria o token com o ID e perfil do usuário — esses dados ficam "dentro" do JWT
    token = create_access_token({"sub": str(user.id), "profile": user.profile.value})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_name": user.name,
        "user_profile": user.profile.value,
    }
