from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import uuid


class CandidatoSimples(BaseModel):
    id: uuid.UUID
    nm_candidato: str
    sg_partido: Optional[str] = None
    cargo: Optional[str] = None
    sg_uf: Optional[str] = None

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    profile: str
    candidate_name: Optional[str] = None
    candidato_id: Optional[uuid.UUID] = None
    candidato: Optional[CandidatoSimples] = None
    can_export: bool
    can_compare: bool
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    profile: str
    candidate_name: Optional[str] = None
    candidato_id: Optional[uuid.UUID] = None
    can_export: bool = True
    can_compare: bool = False


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    profile: Optional[str] = None
    candidate_name: Optional[str] = None
    candidato_id: Optional[uuid.UUID] = None
    can_export: Optional[bool] = None
    can_compare: Optional[bool] = None
    is_active: Optional[bool] = None
