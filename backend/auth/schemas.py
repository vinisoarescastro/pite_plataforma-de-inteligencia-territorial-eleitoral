# Schemas de dados para autenticação.
# Pydantic valida automaticamente os dados recebidos/enviados pela API.

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    """Dados que o frontend envia para fazer login."""
    email: EmailStr   # Pydantic já valida se é um e-mail válido
    password: str


class TokenResponse(BaseModel):
    """Dados que a API devolve após um login bem-sucedido."""
    access_token: str    # O token JWT para usar nas próximas requisições
    token_type: str = "bearer"
    user_name: str       # Nome do usuário logado
    user_profile: str    # Perfil: administrador, gestor, analista ou assessor
