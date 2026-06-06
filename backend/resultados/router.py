from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from dependencies import get_current_user, require_admin
from models.eleitoral import Candidato, ResultadoEleitoral, Eleicao, VotacaoSecao
from .schemas import (
    CandidatoCreate, CandidatoOut,
    ResultadoMunicipioOut, ResultadoHistoricoItem, ResultadoMapaItem,
    VotacaoSecaoItem, VotacaoZonaAgregada, VotacaoMunicipioAgregada, VotavelOut,
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


# ══════════════════════════════════════════════════════════════════
# VOTAÇÃO POR SEÇÃO
# ══════════════════════════════════════════════════════════════════

@router.get("/secoes/municipio/{cd_municipio_tse}", response_model=list[VotacaoSecaoItem])
def votacao_por_secao(
    cd_municipio_tse: str,
    eleicao_id: UUID = Query(..., description="ID da eleição"),
    nr_votavel: str  = Query(None, description="Número do candidato/votável para filtrar"),
    cd_cargo: int    = Query(None, description="Código do cargo para filtrar"),
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    """
    Retorna os votos por seção eleitoral de um município.
    Útil para mapas de calor intramunicipais por local de votação.
    """
    q = db.query(VotacaoSecao).filter_by(
        eleicao_id=eleicao_id,
        cd_municipio_tse=cd_municipio_tse,
    )
    if nr_votavel:
        q = q.filter(VotacaoSecao.nr_votavel == nr_votavel)
    if cd_cargo is not None:
        q = q.filter(VotacaoSecao.cd_cargo == cd_cargo)
    return q.order_by(VotacaoSecao.nr_zona, VotacaoSecao.nr_secao).all()


@router.get("/secoes/municipio/{cd_municipio_tse}/por-zona", response_model=list[VotacaoZonaAgregada])
def votacao_por_zona(
    cd_municipio_tse: str,
    eleicao_id: UUID = Query(..., description="ID da eleição"),
    nr_votavel: str  = Query(None, description="Número do candidato/votável"),
    nr_turno: int    = Query(None, description="Número do turno"),
    cd_cargo: int    = Query(None, description="Código do cargo"),
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    """
    Agrega votos por zona eleitoral dentro de um município.
    """
    q = (
        db.query(
            VotacaoSecao.cd_municipio_tse,
            VotacaoSecao.nr_zona,
            VotacaoSecao.nr_votavel,
            VotacaoSecao.nm_votavel,
            VotacaoSecao.ds_cargo,
            func.sum(VotacaoSecao.qt_votos).label("total_votos"),
        )
        .filter_by(eleicao_id=eleicao_id, cd_municipio_tse=cd_municipio_tse)
    )
    if nr_votavel:
        q = q.filter(VotacaoSecao.nr_votavel == nr_votavel)
    if nr_turno is not None:
        q = q.filter(VotacaoSecao.nr_turno == nr_turno)
    if cd_cargo is not None:
        q = q.filter(VotacaoSecao.cd_cargo == cd_cargo)

    rows = q.group_by(
        VotacaoSecao.cd_municipio_tse,
        VotacaoSecao.nr_zona,
        VotacaoSecao.nr_votavel,
        VotacaoSecao.nm_votavel,
        VotacaoSecao.ds_cargo,
    ).order_by(VotacaoSecao.nr_zona).all()

    return [
        VotacaoZonaAgregada(
            cd_municipio_tse=r.cd_municipio_tse,
            nr_zona=r.nr_zona,
            nr_votavel=r.nr_votavel,
            nm_votavel=r.nm_votavel,
            ds_cargo=r.ds_cargo,
            total_votos=r.total_votos,
        )
        for r in rows
    ]


@router.get("/secoes/mapa/uf/{sg_uf}", response_model=list[VotacaoMunicipioAgregada])
def votacao_mapa_por_uf(
    sg_uf: str,
    eleicao_id: UUID = Query(...),
    nr_votavel: str  = Query(None),
    nm_votavel: str  = Query(None),
    nr_turno: int    = Query(None),
    cd_cargo: int    = Query(None),
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    """
    Total de votos por município de uma UF — usado para colorir o mapa.
    Retorna cd_municipio_tse, total_votos e pct relativo ao maior município.
    """
    from models.eleitoral import MunicipioTSE

    q = (
        db.query(
            VotacaoSecao.cd_municipio_tse,
            MunicipioTSE.cd_ibge,
            func.sum(VotacaoSecao.qt_votos).label("total_votos"),
        )
        .join(MunicipioTSE, VotacaoSecao.cd_municipio_tse == MunicipioTSE.cd_tse)
        .filter(
            VotacaoSecao.eleicao_id == eleicao_id,
            MunicipioTSE.sg_uf == sg_uf.upper(),
        )
    )
    if nr_votavel:
        q = q.filter(VotacaoSecao.nr_votavel == nr_votavel)
    if nm_votavel:
        q = q.filter(func.upper(VotacaoSecao.nm_votavel) == nm_votavel.upper())
    if nr_turno is not None:
        q = q.filter(VotacaoSecao.nr_turno == nr_turno)
    if cd_cargo is not None:
        q = q.filter(VotacaoSecao.cd_cargo == cd_cargo)

    rows = q.group_by(VotacaoSecao.cd_municipio_tse, MunicipioTSE.cd_ibge).all()
    if not rows:
        return []

    max_votos = max(r.total_votos for r in rows) or 1
    return [
        VotacaoMunicipioAgregada(
            cd_municipio_tse=r.cd_municipio_tse,
            cd_municipio_ibge=r.cd_ibge,
            total_votos=r.total_votos,
            pct_votos=round(r.total_votos / max_votos * 100, 2),
        )
        for r in rows
    ]


@router.get("/secoes/votaveis", response_model=list[VotavelOut])
def listar_votaveis(
    eleicao_id: UUID = Query(...),
    nr_turno: int    = Query(None),
    ds_cargo: str    = Query(None),
    sg_partido: str  = Query(None),
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    """
    Lista candidatos/votáveis distintos de uma eleição com filtros opcionais.
    Exclui votos em branco (95), nulo (96) e anulado (97).
    """
    q = (
        db.query(
            VotacaoSecao.nr_votavel,
            VotacaoSecao.nm_votavel,
            VotacaoSecao.ds_cargo,
        )
        .filter(
            VotacaoSecao.eleicao_id == eleicao_id,
            VotacaoSecao.nr_votavel.notin_(['95', '96', '97']),
        )
        .distinct()
    )
    if nr_turno is not None:
        q = q.filter(VotacaoSecao.nr_turno == nr_turno)
    if ds_cargo:
        q = q.filter(func.upper(VotacaoSecao.ds_cargo) == ds_cargo.upper())

    rows = q.order_by(VotacaoSecao.nm_votavel).all()
    return [
        VotavelOut(nr_votavel=r.nr_votavel, nm_votavel=r.nm_votavel,
                   ds_cargo=r.ds_cargo, sg_partido=None)
        for r in rows
    ]


@router.get("/secoes/cargos", response_model=list[str])
def listar_cargos(
    eleicao_id: UUID = Query(...),
    nr_turno: int    = Query(None),
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    """Lista os cargos disponíveis numa eleição."""
    q = (
        db.query(VotacaoSecao.ds_cargo)
        .filter(VotacaoSecao.eleicao_id == eleicao_id)
        .distinct()
    )
    if nr_turno is not None:
        q = q.filter(VotacaoSecao.nr_turno == nr_turno)
    rows = q.order_by(VotacaoSecao.ds_cargo).all()
    return [r.ds_cargo for r in rows if r.ds_cargo]
