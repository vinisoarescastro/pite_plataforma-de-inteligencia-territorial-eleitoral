from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user, require_admin
from models.eleitoral import Eleicao
from .schemas import EleicaoCreate, EleicaoOut

router = APIRouter(prefix="/eleicoes", tags=["Eleições"])


@router.get("", response_model=list[EleicaoOut])
def listar_eleicoes(
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    """Lista todas as eleições cadastradas, ordenadas do mais recente."""
    return db.query(Eleicao).order_by(Eleicao.ano.desc(), Eleicao.turno).all()


@router.post("", response_model=EleicaoOut, status_code=201)
def criar_eleicao(
    body: EleicaoCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    """Cria uma eleição. Restrito ao administrador."""
    existente = db.query(Eleicao).filter_by(
        ano=body.ano, turno=body.turno, tipo=body.tipo
    ).first()
    if existente:
        raise HTTPException(400, "Eleição já cadastrada com esse ano/turno/tipo.")
    eleicao = Eleicao(**body.model_dump())
    db.add(eleicao)
    db.commit()
    db.refresh(eleicao)
    return eleicao


@router.delete("/{eleicao_id}", status_code=204)
def excluir_eleicao(
    eleicao_id: UUID,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    """Remove uma eleição e todos os seus resultados (CASCADE). Restrito ao administrador."""
    eleicao = db.get(Eleicao, eleicao_id)
    if not eleicao:
        raise HTTPException(404, "Eleição não encontrada.")
    db.delete(eleicao)
    db.commit()
