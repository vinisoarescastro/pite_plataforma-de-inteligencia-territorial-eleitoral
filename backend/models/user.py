# Model do usuário — define a tabela "users" no banco de dados.

import uuid
import enum
from sqlalchemy import Column, String, Boolean, Enum as PgEnum, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from database import Base


class UserProfile(str, enum.Enum):
    """
    Os 4 perfis de acesso do sistema (RBAC — controle de acesso por perfil).
    - administrador: acesso total
    - gestor: gerencia candidatos e equipes
    - analista: analisa dados e gera relatórios
    - assessor: visualiza dados do candidato vinculado
    """
    administrador = "administrador"
    gestor = "gestor"
    analista = "analista"
    assessor = "assessor"


class User(Base):
    """
    Representa um usuário do sistema.
    Cada campo vira uma coluna na tabela "users" do PostgreSQL.
    """
    __tablename__ = "users"

    # UUID é um ID único global — mais seguro que um inteiro sequencial
    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name          = Column(String(120), nullable=False)
    email         = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)   # nunca salvar senha em texto puro
    profile       = Column(PgEnum(UserProfile), nullable=False)
    is_active     = Column(Boolean, default=True)

    # server_default=func.now() faz o banco preencher o campo automaticamente
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), onupdate=func.now())
