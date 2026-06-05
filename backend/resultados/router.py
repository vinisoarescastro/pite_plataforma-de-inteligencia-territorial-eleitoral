from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from dependencies import get_current_user, require_admin
from models.eleitoral import Candidato, ResultadoEleitoral, Eleicao
from .schemas import (
    CandidatoCreate, CandidatoOut,
    ResultadoMunicipioOut, ResultadoHistoricoItem, ResultadoMapaItem,
)

router = APIRouter(tags=["Resultados"])


# ══════════════════════════════════════════════════════════════════
# CANDIDATOS
# ══════════════════════════════════════════════════════════════════

@router.get("/candidatos", response_model=list[CandidatoOut])
def listar_candidatos(
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    """Lista todos os candidatos cadastrados."""
    return db.query(Candidato).order_by(Candidato.nm_candidato).all()


@router.post("/candidatos", response_model=CandidatoOut, status_code=201)
def criar_candidato(
    body: CandidatoCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    """Cria um candidato manualmente. Normalmente preenchido pela importação do TSE."""
    candidato = Candidato(**body.model_dump())
    db.add(candidato)
    db.commit()
    db.refresh(candidato)
    return candidato


# ══════════════════════════════════════════════════════════════════
# RESULTADOS — por município
# ══════════════════════════════════════════════════════════════════

@router.get("/resultados/municipio/{cd_ibge}", response_model=ResultadoMunicipioOut)
def resultado_municipio(
    cd_ibge: str,
    eleicao_id: UUID = Query(..., description="ID da eleição"),
    candidato_id: UUID = Query(..., description="ID do candidato"),
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    """
    Retorna os votos de um candidato em um município numa eleição específica.
    Usado no painel lateral do mapa quando o usuário clica num município.
    """
    resultado = (
        db.query(ResultadoEleitoral)
        .filter_by(
            cd_municipio_ibge=cd_ibge,
            eleicao_id=eleicao_id,
            candidato_id=candidato_id,
        )
        .first()
    )
    if not resultado:
        raise HTTPException(404, "Nenhum resultado encontrado para esse município/eleição/candidato.")

    pct = None
    if resultado.qt_votos_validos and resultado.qt_votos_validos > 0:
        pct = round(resultado.qt_votos_nominais / resultado.qt_votos_validos * 100, 2)

    return ResultadoMunicipioOut(
        cd_municipio_ibge=resultado.cd_municipio_ibge,
        qt_votos_nominais=resultado.qt_votos_nominais,
        qt_votos_validos=resultado.qt_votos_validos,
        qt_aptos=resultado.qt_aptos,
        qt_abstencoes=resultado.qt_abstencoes,
        pct_votos=pct,
    )


@router.get("/resultados/municipio/{cd_ibge}/historico", response_model=list[ResultadoHistoricoItem])
def historico_municipio(
    cd_ibge: str,
    candidato_id: UUID = Query(..., description="ID do candidato"),
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    """
    Histórico de todas as eleições de um candidato num município.
    Usado na tabela de histórico do painel lateral do mapa.
    """
    rows = (
        db.query(ResultadoEleitoral, Eleicao)
        .join(Eleicao, ResultadoEleitoral.eleicao_id == Eleicao.id)
        .filter(
            ResultadoEleitoral.cd_municipio_ibge == cd_ibge,
            ResultadoEleitoral.candidato_id == candidato_id,
        )
        .order_by(Eleicao.ano.desc(), Eleicao.turno)
        .all()
    )

    historico = []
    for res, el in rows:
        pct = None
        if res.qt_votos_validos and res.qt_votos_validos > 0:
            pct = round(res.qt_votos_nominais / res.qt_votos_validos * 100, 2)
        historico.append(ResultadoHistoricoItem(
            eleicao_id=el.id,
            ano=el.ano,
            turno=el.turno,
            tipo=el.tipo,
            descricao=el.descricao,
            qt_votos_nominais=res.qt_votos_nominais,
            qt_votos_validos=res.qt_votos_validos,
            pct_votos=pct,
        ))
    return historico


# ══════════════════════════════════════════════════════════════════
# RESULTADOS — para o mapa (todos os municípios de uma eleição)
# ══════════════════════════════════════════════════════════════════

@router.get("/resultados/mapa", response_model=list[ResultadoMapaItem])
def resultados_para_mapa(
    eleicao_id: UUID = Query(..., description="ID da eleição"),
    candidato_id: UUID = Query(..., description="ID do candidato"),
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    """
    Retorna votos e % para todos os municípios de uma eleição/candidato.
    Usado para colorir o mapa proporcionalmente (quanto mais votos, mais escuro).
    """
    rows = (
        db.query(ResultadoEleitoral)
        .filter_by(eleicao_id=eleicao_id, candidato_id=candidato_id)
        .all()
    )

    resultado = []
    for r in rows:
        pct = None
        if r.qt_votos_validos and r.qt_votos_validos > 0:
            pct = round(r.qt_votos_nominais / r.qt_votos_validos * 100, 2)
        resultado.append(ResultadoMapaItem(
            cd_municipio_ibge=r.cd_municipio_ibge,
            qt_votos_nominais=r.qt_votos_nominais,
            pct_votos=pct,
        ))
    return resultado


# ══════════════════════════════════════════════════════════════════
# RESUMO — totais por UF ou região (para o painel lateral)
# ══════════════════════════════════════════════════════════════════

@router.get("/resultados/resumo/uf")
def resumo_por_uf(
    eleicao_id: UUID = Query(...),
    candidato_id: UUID = Query(...),
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    """
    Soma de votos por UF para um candidato numa eleição.
    Usa a tabela de correspondência municipio_tse_ibge para agrupar por estado.
    """
    from models.eleitoral import MunicipioTSE
    from sqlalchemy import cast, String

    rows = (
        db.query(
            MunicipioTSE.sg_uf,
            func.sum(ResultadoEleitoral.qt_votos_nominais).label("total_votos"),
            func.sum(ResultadoEleitoral.qt_votos_validos).label("total_validos"),
        )
        .join(MunicipioTSE, ResultadoEleitoral.cd_municipio_ibge == cast(MunicipioTSE.cd_ibge, String))
        .filter(
            ResultadoEleitoral.eleicao_id == eleicao_id,
            ResultadoEleitoral.candidato_id == candidato_id,
        )
        .group_by(MunicipioTSE.sg_uf)
        .order_by(func.sum(ResultadoEleitoral.qt_votos_nominais).desc())
        .all()
    )

    return [
        {
            "sg_uf": sg_uf,
            "total_votos": total_votos or 0,
            "pct_votos": round(total_votos / total_validos * 100, 2)
            if total_validos and total_validos > 0 else None,
        }
        for sg_uf, total_votos, total_validos in rows
    ]
