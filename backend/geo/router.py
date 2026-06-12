import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from database import get_db
from dependencies import get_current_user, require_admin
from models.eleitoral import Bairro, BairroLocalVotacao
from .schemas import BairroCreate, BairroOut, MunicipioOut, LocalVotacaoOut, VincularLocalRequest

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


# ── Bairros ────────────────────────────────────────────────────────────────────

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

    contagens: dict[uuid.UUID, int] = {}
    if bairros:
        ids = [b.id for b in bairros]
        rows = db.execute(
            text("SELECT bairro_id, COUNT(*) AS c FROM bairro_local_votacao WHERE bairro_id = ANY(:ids) GROUP BY bairro_id"),
            {"ids": ids},
        ).fetchall()
        contagens = {r.bairro_id: r.c for r in rows}

    return [
        BairroOut(
            id=b.id,
            nm_bairro=b.nm_bairro,
            sg_uf=b.sg_uf,
            cd_municipio_ibge=b.cd_municipio_ibge,
            nm_municipio=b.nm_municipio,
            total_locais=contagens.get(b.id, 0),
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
        total_locais=0,
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
        total_locais=total,
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
            text("""
                SELECT COUNT(DISTINCT nr_secao)
                FROM votacao_secao
                WHERE sg_uf = :uf AND cd_municipio_tse = :cd AND nr_local_votacao = :nr
            """),
            {"uf": lnk.sg_uf, "cd": lnk.cd_municipio_tse, "nr": lnk.nr_local_votacao},
        ).scalar() or 0
        result.append(LocalVotacaoOut(
            sg_uf=lnk.sg_uf,
            cd_municipio_tse=lnk.cd_municipio_tse,
            nr_local_votacao=lnk.nr_local_votacao,
            nm_local_votacao=lnk.nm_local_votacao,
            ds_endereco=lnk.ds_endereco,
            total_secoes=count,
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
    existe = db.query(BairroLocalVotacao).filter(
        BairroLocalVotacao.bairro_id == bairro_id,
        BairroLocalVotacao.sg_uf == data.sg_uf,
        BairroLocalVotacao.cd_municipio_tse == data.cd_municipio_tse,
        BairroLocalVotacao.nr_local_votacao == data.nr_local_votacao,
    ).first()
    if existe:
        raise HTTPException(409, "Local já vinculado a este bairro.")
    db.add(BairroLocalVotacao(
        bairro_id=bairro_id,
        sg_uf=data.sg_uf,
        cd_municipio_tse=data.cd_municipio_tse,
        nr_local_votacao=data.nr_local_votacao,
        nm_local_votacao=data.nm_local_votacao,
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
            SELECT
                sg_uf,
                cd_municipio_tse,
                nr_local_votacao,
                MAX(nm_local_votacao) AS nm_local_votacao,
                MAX(ds_endereco)      AS ds_endereco,
                COUNT(DISTINCT nr_secao) AS total_secoes
            FROM votacao_secao
            WHERE sg_uf = :uf
              AND cd_municipio_tse = :cd
              AND nr_local_votacao IS NOT NULL
              AND (:busca = '' OR UPPER(nm_local_votacao) LIKE UPPER(:busca_like))
            GROUP BY sg_uf, cd_municipio_tse, nr_local_votacao
            ORDER BY MAX(nm_local_votacao)
            LIMIT 60
        """),
        {"uf": sg_uf, "cd": cd_municipio_tse, "busca": busca, "busca_like": f"%{busca}%"},
    ).fetchall()

    # Locais já vinculados ao bairro selecionado (para ocultar da lista)
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
            sg_uf=r.sg_uf,
            cd_municipio_tse=r.cd_municipio_tse,
            nr_local_votacao=r.nr_local_votacao,
            nm_local_votacao=r.nm_local_votacao,
            ds_endereco=r.ds_endereco,
            total_secoes=r.total_secoes,
        )
        for r in rows
        if r.nr_local_votacao not in linked
    ]
