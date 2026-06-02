# Funções de segurança: gerar e verificar senhas, criar e ler tokens JWT.

from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from settings import settings

# CryptContext configura o algoritmo de hash de senhas (bcrypt é o padrão moderno)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Transforma a senha em texto puro em um hash seguro para guardar no banco."""
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """Compara a senha digitada com o hash salvo. Retorna True se bater."""
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict) -> str:
    """
    Cria um token JWT com os dados do usuário (ex: id e perfil).
    O token expira após o tempo definido em JWT_EXPIRATION_MINUTES no .env.
    """
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=settings.jwt_expiration_minutes)
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    """Lê e valida um token JWT. Lança erro se o token for inválido ou expirado."""
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
