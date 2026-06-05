from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import uuid


class UserResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    profile: str
    candidate_name: Optional[str] = None
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
    can_export: bool = True
    can_compare: bool = False


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    profile: Optional[str] = None
    candidate_name: Optional[str] = None
    can_export: Optional[bool] = None
    can_compare: Optional[bool] = None
    is_active: Optional[bool] = None
