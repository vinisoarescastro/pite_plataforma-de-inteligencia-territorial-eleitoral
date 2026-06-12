import json
import uuid
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from database import get_db
from dependencies import get_current_user, require_admin
from models.eleitoral import Bairro, BairroLocalVotacao
from .schemas import (
    BairroCreate, BairroOut, MunicipioOut, LocalVotacaoOut, VincularLocalRequest,
    GeocodingRequest, GeocodingStatus,
)
from . import geocoding

router = APIRouter(prefix="/geo", tags=["geo"])


# ── UFs e municípios ───────────────────────────────────────────────────────────

@router.get("/ufs", response_model=list[str])
def listar_ufs(db: Session = Depends(get_db), _=Depends(get_current_user)):
    rows = db.execute(
        text("SELECT DISTINCT sg_uf FROM municipio_tse_ibge ORDER BY sg_uf")
    ).fetchall()
    return [r.sg_uf for r in rows]


@router.get("/municipios", response_model=list[MunicipioOut])
def listar_municipios(
    sg_uf: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    rows = db.execute(
        text("SELECT cd_tse, cd_ibge, nm_municipio FROM municipio_tse_ibge WHERE sg_uf = :uf ORDER BY nm_municipio"),
        {"uf": sg_uf},
    ).fetchall()
    return [MunicipioOut(cd_tse=r.cd_tse, cd_ibge=r.cd_ibge, nm_municipio=r.nm_municipio) for r in rows]


# ── Geocodificação de locais de votação ───────────────────────────────────────

@router.get("/geocoding/status", response_model=GeocodingStatus)
def geocoding_status(
    sg_uf: str,
    cd_municipio_tse: str,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    total = db.execute(text("""
        SELECT COUNT(DISTINCT nr_local_votacao)
        FROM votacao_secao
        WHERE sg_uf = :uf AND cd_municipio_tse = :cd AND nr_local_votacao IS NOT NULL
    """), {"uf": sg_uf, "cd": cd_municipio_tse}).scalar() or 0

    rows = db.execute(text("""
        SELECT status, COUNT(*) AS c
        FROM local_votacao_geo
        WHERE sg_uf = :uf AND cd_municipio_tse = :cd
        GROUP BY status
    """), {"uf": sg_uf, "cd": cd_municipio_tse}).fetchall()
    counts = {r.status: r.c for r in rows}

    return GeocodingStatus(
        total=total,
        geocodificados=counts.get("ok", 0),
        com_erro=counts.get("erro", 0),
        pendentes=counts.get("pendente", 0),
        em_andamento=geocoding.is_running(sg_uf, cd_municipio_tse),
    )


@router.post("/geocoding/municipio", status_code=202)
def iniciar_geocodificacao(
    data: GeocodingRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    key = geocoding.job_key(data.sg_uf, data.cd_municipio_tse)
    if geocoding.is_running(data.sg_uf, data.cd_municipio_tse):
        raise HTTPException(409, "Geocodificação já em andamento para este município.")
    # Reseta erros anteriores para permitir retry
    db.execute(text("""
        UPDATE local_votacao_geo SET status = 'pendente', geocodificado_em = NULL
        WHERE sg_uf = :uf AND cd_municipio_tse = :cd AND status = 'erro'
    """), {"uf": data.sg_uf, "cd": data.cd_municipio_tse})
    db.commit()
    geocoding._running.add(key)
    background_tasks.add_task(geocoding.geocodificar_bg, data.sg_uf, data.cd_municipio_tse, data.nm_municipio)
    return {"ok": True, "message": "Geocodificação iniciada em background."}


# ── GeoJSON de bairros (DEVE vir antes de /bairros/{id}) ──────────────────────

@router.get("/bairros/geojson")
def bairros_geojson(
    sg_uf: str,
    cd_municipio_ibge: str | None = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    sql = """
        SELECT
            id::text,
            nm_bairro,
            cd_municipio_ibge,
            nm_municipio,
            ST_AsGeoJSON(geom)::json AS geometry
        FROM bairro
        WHERE sg_uf = :uf
          AND geom IS NOT NULL
    """
    params: dict = {"uf": sg_uf}
    if cd_municipio_ibge:
        sql += " AND cd_municipio_ibge = :cd"
        params["cd"] = cd_municipio_ibge

    rows = db.execute(text(sql), params).fetchall()
    features = [
        {
            "type": "Feature",
            "geometry": row.geometry,
            "properties": {
                "id": row.id,
                "nm_bairro": row.nm_bairro,
                "cd_municipio_ibge": row.cd_municipio_ibge,
                "nm_municipio": row.nm_municipio,
            },
        }
        for row in rows
    ]
    return JSONResponse({"type": "FeatureCollection", "features": features})


# ── CRUD de bairros ────────────────────────────────────────────────────────────

def _contar_locais(db: Session, bairro_ids: list[uuid.UUID]) -> dict[uuid.UUID, int]:
    if not bairro_ids:
        return {}
    rows = db.execute(
        text("SELECT bairro_id, COUNT(*) AS c FROM bairro_local_votacao WHERE bairro_id = ANY(:ids) GROUP BY bairro_id"),
        {"ids": bairro_ids},
    ).fetchall()
    return {r.bairro_id: r.c for r in rows}


def _tem_geom(db: Session, bairro_id: uuid.UUID) -> bool:
    row = db.execute(
        text("SELECT geom IS NOT NULL AS has_geom FROM bairro WHERE id = :id"),
        {"id": str(bairro_id)},
    ).fetchone()
    return bool(row and row.has_geom)


@router.get("/bairros", response_model=list[BairroOut])
def listar_bairros(
    sg_uf: str,
    cd_municipio_ibge: str | None = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Bairro).filter(Bairro.sg_uf == sg_uf)
    if cd_municipio_ibge:
        q = q.filter(Bairro.cd_municipio_ibge == cd_municipio_ibge)
    bairros = q.order_by(Bairro.nm_bairro).all()

    contagens = _contar_locais(db, [b.id for b in bairros])

    geom_ids: set[str] = set()
    if bairros:
        rows = db.execute(
            text("SELECT id::text FROM bairro WHERE id = ANY(:ids) AND geom IS NOT NULL"),
            {"ids": [b.id for b in bairros]},
        ).fetchall()
        geom_ids = {r.id for r in rows}

    return [
        BairroOut(
            id=b.id, nm_bairro=b.nm_bairro, sg_uf=b.sg_uf,
            cd_municipio_ibge=b.cd_municipio_ibge, nm_municipio=b.nm_municipio,
            total_locais=contagens.get(b.id, 0),
            tem_geom=str(b.id) in geom_ids,
        )
        for b in bairros
    ]


@router.post("/bairros", response_model=BairroOut, status_code=201)
def criar_bairro(
    data: BairroCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    bairro = Bairro(
        nm_bairro=data.nm_bairro.strip(),
        sg_uf=data.sg_uf.upper(),
        cd_municipio_ibge=data.cd_municipio_ibge,
        nm_municipio=data.nm_municipio,
    )
    db.add(bairro)
    db.commit()
    db.refresh(bairro)
    return BairroOut(
        id=bairro.id, nm_bairro=bairro.nm_bairro, sg_uf=bairro.sg_uf,
        cd_municipio_ibge=bairro.cd_municipio_ibge, nm_municipio=bairro.nm_municipio,
        total_locais=0, tem_geom=False,
    )


@router.put("/bairros/{bairro_id}", response_model=BairroOut)
def atualizar_bairro(
    bairro_id: uuid.UUID,
    data: BairroCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    bairro = db.query(Bairro).filter(Bairro.id == bairro_id).first()
    if not bairro:
        raise HTTPException(404, "Bairro não encontrado.")
    bairro.nm_bairro = data.nm_bairro.strip()
    db.commit()
    db.refresh(bairro)
    total = db.query(func.count(BairroLocalVotacao.nr_local_votacao)).filter(
        BairroLocalVotacao.bairro_id == bairro_id
    ).scalar() or 0
    return BairroOut(
        id=bairro.id, nm_bairro=bairro.nm_bairro, sg_uf=bairro.sg_uf,
        cd_municipio_ibge=bairro.cd_municipio_ibge, nm_municipio=bairro.nm_municipio,
        total_locais=total, tem_geom=_tem_geom(db, bairro_id),
    )


@router.delete("/bairros/{bairro_id}", status_code=204)
def excluir_bairro(
    bairro_id: uuid.UUID,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    bairro = db.query(Bairro).filter(Bairro.id == bairro_id).first()
    if not bairro:
        raise HTTPException(404, "Bairro não encontrado.")
    db.delete(bairro)
    db.commit()


# ── Geometria do bairro ────────────────────────────────────────────────────────

@router.patch("/bairros/{bairro_id}/geom", status_code=200)
def salvar_geom(
    bairro_id: uuid.UUID,
    payload: dict,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    if not db.query(Bairro).filter(Bairro.id == bairro_id).first():
        raise HTTPException(404, "Bairro não encontrado.")
    db.execute(
        text("UPDATE bairro SET geom = ST_SetSRID(ST_GeomFromGeoJSON(:geom), 4326) WHERE id = :id"),
        {"geom": json.dumps(payload), "id": str(bairro_id)},
    )
    db.commit()
    return {"ok": True}


@router.delete("/bairros/{bairro_id}/geom", status_code=204)
def remover_geom(
    bairro_id: uuid.UUID,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    if not db.query(Bairro).filter(Bairro.id == bairro_id).first():
        raise HTTPException(404, "Bairro não encontrado.")
    db.execute(text("UPDATE bairro SET geom = NULL WHERE id = :id"), {"id": str(bairro_id)})
    db.commit()


# ── Sugestão automática de locais por polígono ────────────────────────────────

@router.post("/bairros/{bairro_id}/sugerir-locais", response_model=list[LocalVotacaoOut])
def sugerir_locais(
    bairro_id: uuid.UUID,
    payload: dict,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Retorna locais geocodificados dentro do polígono GeoJSON enviado,
    excluindo os que já estão vinculados ao bairro."""
    geom_json = json.dumps(payload)
    rows = db.execute(text("""
        SELECT
            g.sg_uf, g.cd_municipio_tse, g.nr_local_votacao,
            g.nm_local_votacao, g.ds_endereco,
            COUNT(DISTINCT vs.nr_secao) AS total_secoes
        FROM local_votacao_geo g
        LEFT JOIN votacao_secao vs
            ON  vs.sg_uf             = g.sg_uf
            AND vs.cd_municipio_tse  = g.cd_municipio_tse
            AND vs.nr_local_votacao  = g.nr_local_votacao
        WHERE g.status = 'ok'
          AND ST_Within(g.geom, ST_SetSRID(ST_GeomFromGeoJSON(:poly), 4326))
          AND NOT EXISTS (
              SELECT 1 FROM bairro_local_votacao blv
              WHERE blv.bairro_id        = :bid
                AND blv.sg_uf            = g.sg_uf
                AND blv.cd_municipio_tse = g.cd_municipio_tse
                AND blv.nr_local_votacao = g.nr_local_votacao
          )
        GROUP BY g.sg_uf, g.cd_municipio_tse, g.nr_local_votacao, g.nm_local_votacao, g.ds_endereco
        ORDER BY g.nm_local_votacao NULLS LAST
    """), {"poly": geom_json, "bid": str(bairro_id)}).fetchall()

    return [
        LocalVotacaoOut(
            sg_uf=r.sg_uf, cd_municipio_tse=r.cd_municipio_tse,
            nr_local_votacao=r.nr_local_votacao, nm_local_votacao=r.nm_local_votacao,
            ds_endereco=r.ds_endereco, total_secoes=r.total_secoes,
        )
        for r in rows
    ]


# ── Locais vinculados ──────────────────────────────────────────────────────────

@router.get("/bairros/{bairro_id}/locais", response_model=list[LocalVotacaoOut])
def listar_locais_bairro(
    bairro_id: uuid.UUID,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    links = db.query(BairroLocalVotacao).filter(
        BairroLocalVotacao.bairro_id == bairro_id
    ).order_by(BairroLocalVotacao.nm_local_votacao).all()

    result = []
    for lnk in links:
        count = db.execute(
            text("SELECT COUNT(DISTINCT nr_secao) FROM votacao_secao WHERE sg_uf=:uf AND cd_municipio_tse=:cd AND nr_local_votacao=:nr"),
            {"uf": lnk.sg_uf, "cd": lnk.cd_municipio_tse, "nr": lnk.nr_local_votacao},
        ).scalar() or 0
        result.append(LocalVotacaoOut(
            sg_uf=lnk.sg_uf, cd_municipio_tse=lnk.cd_municipio_tse,
            nr_local_votacao=lnk.nr_local_votacao, nm_local_votacao=lnk.nm_local_votacao,
            ds_endereco=lnk.ds_endereco, total_secoes=count,
        ))
    return result


@router.post("/bairros/{bairro_id}/locais", status_code=201)
def vincular_local(
    bairro_id: uuid.UUID,
    data: VincularLocalRequest,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    if not db.query(Bairro).filter(Bairro.id == bairro_id).first():
        raise HTTPException(404, "Bairro não encontrado.")
    if db.query(BairroLocalVotacao).filter(
        BairroLocalVotacao.bairro_id == bairro_id,
        BairroLocalVotacao.sg_uf == data.sg_uf,
        BairroLocalVotacao.cd_municipio_tse == data.cd_municipio_tse,
        BairroLocalVotacao.nr_local_votacao == data.nr_local_votacao,
    ).first():
        raise HTTPException(409, "Local já vinculado a este bairro.")
    db.add(BairroLocalVotacao(
        bairro_id=bairro_id, sg_uf=data.sg_uf, cd_municipio_tse=data.cd_municipio_tse,
        nr_local_votacao=data.nr_local_votacao, nm_local_votacao=data.nm_local_votacao,
        ds_endereco=data.ds_endereco,
    ))
    db.commit()
    return {"ok": True}


@router.delete("/bairros/{bairro_id}/locais", status_code=204)
def desvincular_local(
    bairro_id: uuid.UUID,
    sg_uf: str,
    cd_municipio_tse: str,
    nr_local_votacao: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    link = db.query(BairroLocalVotacao).filter(
        BairroLocalVotacao.bairro_id == bairro_id,
        BairroLocalVotacao.sg_uf == sg_uf,
        BairroLocalVotacao.cd_municipio_tse == cd_municipio_tse,
        BairroLocalVotacao.nr_local_votacao == nr_local_votacao,
    ).first()
    if not link:
        raise HTTPException(404, "Vínculo não encontrado.")
    db.delete(link)
    db.commit()


# ── Busca de locais disponíveis ────────────────────────────────────────────────

@router.get("/locais-votacao", response_model=list[LocalVotacaoOut])
def buscar_locais_votacao(
    sg_uf: str,
    cd_municipio_tse: str,
    busca: str = "",
    bairro_id: str | None = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    rows = db.execute(
        text("""
            SELECT sg_uf, cd_municipio_tse, nr_local_votacao,
                   MAX(nm_local_votacao) AS nm_local_votacao,
                   MAX(ds_endereco)      AS ds_endereco,
                   COUNT(DISTINCT nr_secao) AS total_secoes
            FROM votacao_secao
            WHERE sg_uf = :uf
              AND cd_municipio_tse = :cd
              AND nr_local_votacao IS NOT NULL
              AND (:busca = '' OR UPPER(nm_local_votacao) LIKE UPPER(:like))
            GROUP BY sg_uf, cd_municipio_tse, nr_local_votacao
            ORDER BY MAX(nm_local_votacao)
            LIMIT 60
        """),
        {"uf": sg_uf, "cd": cd_municipio_tse, "busca": busca, "like": f"%{busca}%"},
    ).fetchall()

    linked: set[int] = set()
    if bairro_id:
        try:
            bid = uuid.UUID(bairro_id)
            linked = {
                r.nr_local_votacao
                for r in db.query(BairroLocalVotacao.nr_local_votacao).filter(
                    BairroLocalVotacao.bairro_id == bid,
                    BairroLocalVotacao.cd_municipio_tse == cd_municipio_tse,
                ).all()
            }
        except ValueError:
            pass

    return [
        LocalVotacaoOut(
            sg_uf=r.sg_uf, cd_municipio_tse=r.cd_municipio_tse,
            nr_local_votacao=r.nr_local_votacao, nm_local_votacao=r.nm_local_votacao,
            ds_endereco=r.ds_endereco, total_secoes=r.total_secoes,
        )
        for r in rows
        if r.nr_local_votacao not in linked
    ]
