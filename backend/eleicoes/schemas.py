from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class EleicaoCreate(BaseModel):
    ano: int
    turno: int = 1
    tipo: str   # 'municipal' | 'federal' | 'estadual'
    descricao: str | None = None


class EleicaoOut(BaseModel):
    id: UUID
    ano: int
    turno: int
    tipo: str
    descricao: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
