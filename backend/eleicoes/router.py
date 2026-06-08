import time
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user, require_admin
from models.eleitoral import Eleicao
from .schemas import EleicaoCreate, EleicaoOut

# Cache em memória para o resumo (TTL 600s — já alimentado pela tabela de cache)
_cache_resumo: dict = {"data": None, "ts": 0.0}
_cache_detalhe: dict[str, dict] = {}  # eleicao_id → {"data": ..., "ts": float}
_CACHE_TTL = 600

router = APIRouter(prefix="/eleicoes", tags=["Eleições"])


def _invalidar_cache():
    _cache_resumo["ts"] = 0.0
    _cache_detalhe.clear()


def atualizar_resumo_cache(db: Session, eleicao_id: str):
    """Recalcula e persiste o resumo de uma eleição na tabela de cache.
    Chamado ao final de cada importação de seções.
    """
    db.execute(text("""
        INSERT INTO eleicao_resumo_cache (eleicao_id, municipios, estados, votos_total, atualizado_em)
        WITH cargo_principal AS (
            SELECT MIN(cd_cargo) AS cd_cargo
            FROM votacao_secao
            WHERE eleicao_id = :eid AND cd_cargo IS NOT NULL
        )
        SELECT
            :eid::uuid,
            COUNT(DISTINCT cd_municipio_tse),
            COUNT(DISTINCT sg_uf),
            COALESCE(SUM(CASE WHEN cd_cargo = (SELECT cd_cargo FROM cargo_principal) THEN qt_votos ELSE 0 END), 0)
        FROM votacao_secao
        WHERE eleicao_id = :eid
        ON CONFLICT (eleicao_id) DO UPDATE
            SET municipios    = EXCLUDED.municipios,
                estados       = EXCLUDED.estados,
                votos_total   = EXCLUDED.votos_total,
                atualizado_em = now()
    """), {"eid": eleicao_id})
    db.commit()
    _invalidar_cache()


# ── Resumo instantâneo (lê da tabela de cache) ───────────────────────────────

@router.get("/resumo")
def resumo_eleicoes(
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    if _cache_resumo["data"] is not None and time.time() - _cache_resumo["ts"] < _CACHE_TTL:
        return _cache_resumo["data"]

    # Lê da tabela pré-computada — query trivial, O(n_eleicoes)
    rows = db.execute(text("""
        SELECT
            e.id::text   AS eleicao_id,
            e.ano, e.turno, e.tipo, e.descricao,
            COALESCE(rc.municipios,  0) AS municipios,
            COALESCE(rc.estados,     0) AS estados,
            COALESCE(rc.votos_total, 0) AS votos_total,
            COALESCE((SELECT COUNT(DISTINCT candidato_id)
                      FROM resultados_eleitorais WHERE eleicao_id = e.id), 0) AS total_candidatos,
            COALESCE((SELECT COUNT(*) FROM candidaturas WHERE eleicao_id = e.id), 0) AS total_candidaturas
        FROM eleicoes e
        LEFT JOIN eleicao_resumo_cache rc ON rc.eleicao_id = e.id
        ORDER BY e.ano DESC, e.tipo, e.turno
    """)).mappings().all()

    grupos: dict[tuple, dict] = {}
    for row in rows:
        chave = (row["ano"], row["tipo"])
        if chave not in grupos:
            grupos[chave] = {"ano": row["ano"], "tipo": row["tipo"], "turnos": []}
        grupos[chave]["turnos"].append({
            "eleicao_id":         row["eleicao_id"],
            "turno":              row["turno"],
            "descricao":          row["descricao"],
            "municipios":         row["municipios"],
            "estados":            row["estados"],
            "votos_total":        row["votos_total"],
            "total_candidatos":   row["total_candidatos"],
            "total_candidaturas": row["total_candidaturas"],
        })

    resultado = list(grupos.values())
    _cache_resumo["data"] = resultado
    _cache_resumo["ts"]   = time.time()
    return resultado


# ── Detalhes de uma eleição (por_estado + candidatos) ────────────────────────

@router.get("/{eleicao_id}/detalhes")
def detalhes_eleicao(
    eleicao_id: UUID,
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    eid = str(eleicao_id)
    cached = _cache_detalhe.get(eid)
    if cached and time.time() - cached["ts"] < _CACHE_TTL:
        return cached["data"]

    # Cargo principal
    row_cargo = db.execute(text("""
        SELECT MIN(cd_cargo) AS cd_cargo
        FROM votacao_secao
        WHERE eleicao_id = :eid AND cd_cargo IS NOT NULL
    """), {"eid": eid}).mappings().first()
    cargo_principal = row_cargo["cd_cargo"] if row_cargo else None

    # Breakdown por UF — usa sg_uf direto (sem JOIN)
    por_estado_rows = db.execute(text("""
        SELECT
            sg_uf,
            COUNT(DISTINCT cd_municipio_tse)                                               AS municipios,
            SUM(CASE WHEN (:cargo IS NULL OR cd_cargo = :cargo) THEN qt_votos ELSE 0 END) AS votos
        FROM votacao_secao
        WHERE eleicao_id = :eid AND sg_uf IS NOT NULL
        GROUP BY sg_uf
        ORDER BY sg_uf
    """), {"eid": eid, "cargo": cargo_principal}).mappings().all()

    # Candidatos (top 200 por votos nominais)
    candidatos_rows = db.execute(text("""
        SELECT
            ca.id::text,
            ca.nm_candidato,
            ca.nr_candidato,
            ca.sg_partido,
            ca.sg_uf,
            ca.cargo,
            COALESCE(SUM(r.qt_votos_nominais), 0) AS total_votos,
            EXISTS(
                SELECT 1 FROM candidaturas cu
                WHERE cu.candidato_id = ca.id AND cu.eleicao_id = :eid
            ) AS tem_candidatura
        FROM resultados_eleitorais r
        JOIN candidatos ca ON ca.id = r.candidato_id
        WHERE r.eleicao_id = :eid
        GROUP BY ca.id, ca.nm_candidato, ca.nr_candidato, ca.sg_partido, ca.sg_uf, ca.cargo
        ORDER BY total_votos DESC
        LIMIT 200
    """), {"eid": eid}).mappings().all()

    resultado = {
        "eleicao_id": eid,
        "por_estado": [dict(r) for r in por_estado_rows],
        "candidatos": [dict(r) for r in candidatos_rows],
    }
    _cache_detalhe[eid] = {"data": resultado, "ts": time.time()}
    return resultado


# ── CRUD básico ───────────────────────────────────────────────────────────────

@router.get("", response_model=list[EleicaoOut])
def listar_eleicoes(
    db: Session = Depends(get_db),
    _: object = Depends(get_current_user),
):
    return db.query(Eleicao).order_by(Eleicao.ano.desc(), Eleicao.turno).all()


@router.post("", response_model=EleicaoOut, status_code=201)
def criar_eleicao(
    body: EleicaoCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_admin),
):
    existente = db.query(Eleicao).filter_by(ano=body.ano, turno=body.turno, tipo=body.tipo).first()
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
    eleicao = db.get(Eleicao, eleicao_id)
    if not eleicao:
        raise HTTPException(404, "Eleição não encontrada.")
    # Remove o cache da eleição excluída
    db.execute(text("DELETE FROM eleicao_resumo_cache WHERE eleicao_id = :eid"),
               {"eid": str(eleicao_id)})
    db.delete(eleicao)
    db.commit()
    _invalidar_cache()
