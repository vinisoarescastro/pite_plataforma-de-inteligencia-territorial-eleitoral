from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from dependencies import get_current_user, require_admin
from models.user import User
from models.eleitoral import Candidato, Candidatura, Partido, ResultadoEleitoral, Eleicao, VotacaoSecao
from .schemas import (
    PartidoCreate, PartidoOut,
    CandidatoCreate, CandidatoOut,
    CandidaturaCreate, CandidaturaOut,
    ResultadoMunicipioOut, ResultadoHistoricoItem, ResultadoMapaItem,
    VotacaoSecaoItem, VotacaoZonaAgregada, VotacaoMunicipioAgregada, VotavelOut,
    RankingCandidatoItem, RankingPorCargoOut,
)

router = APIRouter(tags=["Resultados"])


# ══════════════════════════════════════════════════════════════════
# PARTIDOS
# ══════════════════════════════════════════════════════════════════

@router.get("/partidos", response_model=list[PartidoOut])
def listar_partidos(db: Session = Depends(get_db), _: object = Depends(get_current_user)):
    return db.query(Partido).order_by(Partido.sigla).all()


@router.post("/partidos", response_model=PartidoOut, status_code=201)
def criar_partido(body: PartidoCreate, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    if db.query(Partido).filter(Partido.sigla == body.sigla.upper()).first():
        raise HTTPException(400, "Já existe um partido com esta sigla.")
    partido = Partido(**body.model_dump() | {"sigla": body.sigla.upper()})
    db.add(partido)
    db.commit()
    db.refresh(partido)
    return partido


@router.put("/partidos/{partido_id}", response_model=PartidoOut)
def atualizar_partido(partido_id: UUID, body: PartidoCreate, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    partido = db.query(Partido).filter(Partido.id == partido_id).first()
    if not partido:
        raise HTTPException(404, "Partido não encontrado.")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(partido, field, value.upper() if field == "sigla" else value)
    db.commit()
    db.refresh(partido)
    return partido


@router.delete("/partidos/{partido_id}", status_code=204)
def excluir_partido(partido_id: UUID, db: Session = Depends(get_db), _: object = Depends(require_admin)):
    partido = db.query(Partido).filter(Partido.id == partido_id).first()
    if not partido:
        raise HTTPException(404, "Partido não encontrado.")
    db.delete(partido)
    db.commit()


# ══════════════════════════════════════════════════════════════════
# CANDIDATOS
# ══════════════════════════════════════════════════════════════════

@router.get("/candidatos", response_model=list[CandidatoOut])
def listar_candidatos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin vê todos os candidatos. Demais perfis veem só o candidato vinculado à sua conta."""
    if current_user.profile.value == "administrador":
        return db.query(Candidato).order_by(Candidato.nm_candidato).all()
    if current_user.candidato_id:
        candidato = db.query(Candidato).filter(Candidato.id == current_user.candidato_id).first()
        return [candidato] if candidato else []
    return []


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


@router.put("/candidatos/{candidato_id}", response_model=CandidatoOut)
def atualizar_candidato(
    candidato_id: UUID,
    body: CandidatoCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    """Atualiza os dados de um candidato."""
    candidato = db.query(Candidato).filter(Candidato.id == candidato_id).first()
    if not candidato:
        raise HTTPException(404, "Candidato não encontrado.")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(candidato, field, value)
    db.commit()
    db.refresh(candidato)
    return candidato


@router.delete("/candidatos/{candidato_id}", status_code=204)
def excluir_candidato(
    candidato_id: UUID,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    """Remove um candidato. Falha se houver resultados eleitorais associados."""
    candidato = db.query(Candidato).filter(Candidato.id == candidato_id).first()
    if not candidato:
        raise HTTPException(404, "Candidato não encontrado.")
    db.delete(candidato)
    db.commit()


# ══════════════════════════════════════════════════════════════════
# CANDIDATURAS
# ══════════════════════════════════════════════════════════════════

@router.get("/candidatos/{candidato_id}/candidaturas", response_model=list[CandidaturaOut])
def listar_candidaturas(
    candidato_id: UUID,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    """Lista todas as candidaturas de um candidato."""
    return (
        db.query(Candidatura)
        .filter(Candidatura.candidato_id == candidato_id)
        .order_by(Candidatura.eleicao_id)
        .all()
    )


@router.post("/candidaturas", response_model=CandidaturaOut, status_code=201)
def criar_candidatura(
    body: CandidaturaCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    """Vincula um candidato a uma eleição."""
    existe = db.query(Candidatura).filter_by(
        candidato_id=body.candidato_id, eleicao_id=body.eleicao_id
    ).first()
    if existe:
        raise HTTPException(400, "Este candidato já está vinculado a esta eleição.")

    # Auto-preenche dados do TSE se sq_candidato_tse for fornecido
    nr_votavel = body.nr_votavel
    nm_votavel = body.nm_votavel
    ds_cargo   = body.ds_cargo

    if body.sq_candidato_tse and not (nr_votavel and nm_votavel):
        secao = (
            db.query(VotacaoSecao)
            .filter(
                VotacaoSecao.eleicao_id == body.eleicao_id,
                VotacaoSecao.sq_candidato == str(body.sq_candidato_tse),
            )
            .first()
        )
        if secao:
            nr_votavel = nr_votavel or secao.nr_votavel
            nm_votavel = nm_votavel or secao.nm_votavel
            ds_cargo   = ds_cargo   or secao.ds_cargo

    candidatura = Candidatura(
        candidato_id=body.candidato_id,
        eleicao_id=body.eleicao_id,
        sq_candidato_tse=body.sq_candidato_tse,
        nr_votavel=nr_votavel,
        nm_votavel=nm_votavel,
        ds_cargo=ds_cargo,
        situacao=body.situacao,
    )
    db.add(candidatura)
    db.commit()
    db.refresh(candidatura)
    return candidatura


@router.put("/candidaturas/{candidatura_id}", response_model=CandidaturaOut)
def atualizar_candidatura(
    candidatura_id: UUID,
    body: CandidaturaCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    """Atualiza dados de uma candidatura."""
    c = db.query(Candidatura).filter(Candidatura.id == candidatura_id).first()
    if not c:
        raise HTTPException(404, "Candidatura não encontrada.")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(c, field, value)
    db.commit()
    db.refresh(c)
    return c


@router.delete("/candidaturas/{candidatura_id}", status_code=204)
def excluir_candidatura(
    candidatura_id: UUID,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    """Remove o vínculo de um candidato com uma eleição."""
    c = db.query(Candidatura).filter(Candidatura.id == candidatura_id).first()
    if not c:
        raise HTTPException(404, "Candidatura não encontrada.")
    db.delete(c)
    db.commit()


@router.get("/candidaturas/buscar-votavel", response_model=list[VotavelOut])
def buscar_votavel_por_sq(
    eleicao_id: UUID = Query(...),
    sq_candidato_tse: int = Query(None),
    nome: str = Query(None),
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    """
    Busca votáveis em VotacaoSecao por sq_candidato_tse ou nome,
    para ajudar a preencher o vínculo da candidatura.
    """
    q = db.query(
        VotacaoSecao.sq_candidato,
        func.max(VotacaoSecao.nr_votavel).label("nr_votavel"),
        func.max(VotacaoSecao.nm_votavel).label("nm_votavel"),
        func.max(VotacaoSecao.ds_cargo).label("ds_cargo"),
    ).filter(
        VotacaoSecao.eleicao_id == eleicao_id,
        VotacaoSecao.sq_candidato.isnot(None),
    )

    if sq_candidato_tse:
        q = q.filter(VotacaoSecao.sq_candidato == str(sq_candidato_tse))
    elif nome:
        q = q.filter(VotacaoSecao.nm_votavel.ilike(f"%{nome}%"))
    else:
        return []

    rows = q.group_by(VotacaoSecao.sq_candidato).limit(30).all()
    return [
        VotavelOut(
            sq_candidato=r.sq_candidato,
            nr_votavel=r.nr_votavel,
            nm_votavel=r.nm_votavel,
            ds_cargo=r.ds_cargo,
        )
        for r in rows
    ]


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
            func.max(VotacaoSecao.nm_votavel).label("nm_votavel"),
            func.max(VotacaoSecao.ds_cargo).label("ds_cargo"),
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
        VotavelOut(nr_votavel=r.nr_votavel, nm_votavel=r.nm_votavel, ds_cargo=r.ds_cargo)
        for r in rows
    ]


@router.get("/secoes/ranking/ibge/{cd_ibge}", response_model=list[RankingPorCargoOut])
def ranking_municipio_por_ibge(
    cd_ibge: str,
    eleicao_id: UUID = Query(...),
    nr_turno: int    = Query(None),
    ds_cargo: str    = Query(None),
    limit: int       = Query(10),
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    """
    Ranking por código IBGE — converte para TSE internamente.
    """
    from models.eleitoral import MunicipioTSE
    mun = db.query(MunicipioTSE).filter(MunicipioTSE.cd_ibge == cd_ibge).first()
    if not mun:
        # tenta sem o dígito verificador (6 dígitos)
        mun = db.query(MunicipioTSE).filter(MunicipioTSE.cd_ibge == cd_ibge[:6]).first()
    if not mun:
        return []
    return _ranking_por_tse(mun.cd_tse, eleicao_id, nr_turno, ds_cargo, limit, db)


@router.get("/secoes/zonas/ibge/{cd_ibge}", response_model=list[VotacaoZonaAgregada])
def zonas_por_ibge(
    cd_ibge: str,
    eleicao_id: UUID = Query(...),
    nr_votavel: str  = Query(None),
    nr_turno: int    = Query(None),
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    """
    Votos por zona usando código IBGE — converte para TSE internamente.
    """
    from models.eleitoral import MunicipioTSE
    mun = db.query(MunicipioTSE).filter(MunicipioTSE.cd_ibge == cd_ibge).first()
    if not mun:
        mun = db.query(MunicipioTSE).filter(MunicipioTSE.cd_ibge == cd_ibge[:6]).first()
    if not mun:
        return []

    q = (
        db.query(
            VotacaoSecao.cd_municipio_tse,
            VotacaoSecao.nr_zona,
            VotacaoSecao.nr_votavel,
            func.max(VotacaoSecao.nm_votavel).label("nm_votavel"),
            func.max(VotacaoSecao.ds_cargo).label("ds_cargo"),
            func.sum(VotacaoSecao.qt_votos).label("total_votos"),
        )
        .filter_by(eleicao_id=eleicao_id, cd_municipio_tse=mun.cd_tse)
    )
    if nr_votavel:
        q = q.filter(VotacaoSecao.nr_votavel == nr_votavel)
    if nr_turno is not None:
        q = q.filter(VotacaoSecao.nr_turno == nr_turno)

    rows = q.group_by(
        VotacaoSecao.cd_municipio_tse,
        VotacaoSecao.nr_zona,
        VotacaoSecao.nr_votavel,
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


def _ranking_por_tse(
    cd_municipio_tse: str,
    eleicao_id,
    nr_turno,
    ds_cargo,
    limit: int,
    db: Session,
) -> list[RankingPorCargoOut]:
    """Lógica compartilhada de ranking, reutilizada pelos endpoints TSE e IBGE."""
    q = (
        db.query(
            VotacaoSecao.ds_cargo,
            VotacaoSecao.nr_votavel,
            VotacaoSecao.nm_votavel,
            func.sum(VotacaoSecao.qt_votos).label("total_votos"),
        )
        .filter(
            VotacaoSecao.eleicao_id == eleicao_id,
            VotacaoSecao.cd_municipio_tse == cd_municipio_tse,
            VotacaoSecao.nr_votavel.notin_(["95", "96", "97"]),
        )
    )
    if nr_turno is not None:
        q = q.filter(VotacaoSecao.nr_turno == nr_turno)
    if ds_cargo:
        q = q.filter(func.upper(VotacaoSecao.ds_cargo) == ds_cargo.upper())

    rows = (
        q.group_by(VotacaoSecao.ds_cargo, VotacaoSecao.nr_votavel, VotacaoSecao.nm_votavel)
        .order_by(VotacaoSecao.ds_cargo, func.sum(VotacaoSecao.qt_votos).desc())
        .all()
    )

    from collections import defaultdict
    grupos: dict[str, list] = defaultdict(list)
    for r in rows:
        grupos[r.ds_cargo or ""].append(r)

    resultado = []
    for cargo_nome, candidatos in grupos.items():
        top = candidatos[:limit]
        total_cargo = sum(c.total_votos for c in candidatos)
        resultado.append(RankingPorCargoOut(
            ds_cargo=cargo_nome,
            total_votos_cargo=total_cargo,
            candidatos=[
                RankingCandidatoItem(
                    nr_votavel=c.nr_votavel,
                    nm_votavel=c.nm_votavel,
                    ds_cargo=c.ds_cargo,
                    total_votos=c.total_votos,
                    pct_votos=round(c.total_votos / total_cargo * 100, 1) if total_cargo > 0 else None,
                )
                for c in top
            ],
        ))

    resultado.sort(key=lambda x: x.total_votos_cargo, reverse=True)
    return resultado


@router.get("/secoes/municipio/{cd_municipio_tse}/ranking", response_model=list[RankingPorCargoOut])
def ranking_municipio(
    cd_municipio_tse: str,
    eleicao_id: UUID = Query(...),
    nr_turno: int    = Query(None),
    ds_cargo: str    = Query(None),
    limit: int       = Query(10),
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    return _ranking_por_tse(cd_municipio_tse, eleicao_id, nr_turno, ds_cargo, limit, db)


@router.get("/secoes/mapa/brasil")
def votacao_mapa_brasil(
    eleicao_id: UUID = Query(...),
    nr_votavel: str  = Query(None),
    nm_votavel: str  = Query(None),
    nr_turno: int    = Query(None),
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    """Total de votos por UF para um candidato — visão nacional."""
    q = (
        db.query(
            VotacaoSecao.sg_uf,
            func.sum(VotacaoSecao.qt_votos).label("total_votos"),
        )
        .filter(VotacaoSecao.eleicao_id == eleicao_id, VotacaoSecao.sg_uf.isnot(None))
    )
    if nr_votavel: q = q.filter(VotacaoSecao.nr_votavel == nr_votavel)
    if nm_votavel: q = q.filter(func.upper(VotacaoSecao.nm_votavel) == nm_votavel.upper())
    if nr_turno is not None: q = q.filter(VotacaoSecao.nr_turno == nr_turno)

    rows = q.group_by(VotacaoSecao.sg_uf).order_by(func.sum(VotacaoSecao.qt_votos).desc()).all()
    if not rows:
        return []
    max_votos = max(r.total_votos for r in rows) or 1
    return [
        {"sg_uf": r.sg_uf, "total_votos": r.total_votos, "pct_relativo": round(r.total_votos / max_votos * 100, 2)}
        for r in rows
    ]


@router.get("/secoes/ufs-com-dados", response_model=list[str])
def ufs_com_dados(
    eleicao_id: UUID = Query(...),
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    """Lista as UFs que possuem dados de votação por seção para uma eleição."""
    from sqlalchemy import text
    sql = text("""
        SELECT DISTINCT sg_uf
        FROM votacao_secao
        WHERE eleicao_id = :eleicao_id AND sg_uf IS NOT NULL
        ORDER BY sg_uf
    """)
    rows = db.execute(sql, {"eleicao_id": str(eleicao_id)}).fetchall()
    return [r[0] for r in rows]


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
