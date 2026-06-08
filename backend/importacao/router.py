import json
import shutil
import tempfile
import time
from pathlib import Path

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
from dependencies import require_admin
from models.user import User
from models.eleitoral import ImportacaoLog
from .service import importar_municipios, importar_resultados, importar_secoes, status_importacao
from eleicoes.router import _invalidar_cache as _invalidar_cache_eleicoes, atualizar_resumo_cache

router = APIRouter(prefix="/importar", tags=["importacao"])


def _salvar_temp(arquivo: UploadFile) -> Path:
    suffix = Path(arquivo.filename or "upload").suffix or ".csv"
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        shutil.copyfileobj(arquivo.file, tmp)
    finally:
        tmp.close()
    return Path(tmp.name)


def _gravar_log(db: Session, *, tipo: str, arquivo: str | None, status: str,
                mensagem: str | None = None, inseridos: int | None = None,
                processadas: int | None = None, eleicao_id: str | None = None,
                duracao_s: float | None = None):
    try:
        log = ImportacaoLog(
            tipo=tipo, arquivo=arquivo, status=status, mensagem=mensagem,
            inseridos=inseridos, processadas=processadas,
            eleicao_id=eleicao_id, duracao_s=duracao_s,
        )
        db.add(log)
        db.commit()
    except Exception:
        db.rollback()


def _sse_stream(gen, tmp_path: Path, *, db: Session, tipo: str, arquivo: str | None):
    """Itera um generator de dicts, emite como SSE e grava log ao final."""
    t0 = time.time()
    ultimo: dict = {}
    try:
        for update in gen:
            ultimo = update
            yield f"data: {json.dumps(update, ensure_ascii=False)}\n\n"
    except Exception as e:
        duracao = time.time() - t0
        _gravar_log(db, tipo=tipo, arquivo=arquivo, status="erro",
                    mensagem=str(e), duracao_s=round(duracao, 1))
        yield f"data: {json.dumps({'tipo': 'erro', 'mensagem': str(e)}, ensure_ascii=False)}\n\n"
        return
    finally:
        tmp_path.unlink(missing_ok=True)

    duracao = time.time() - t0
    if ultimo.get("tipo") == "concluido":
        _gravar_log(
            db, tipo=tipo, arquivo=arquivo, status="sucesso",
            inseridos=ultimo.get("inseridos") or ultimo.get("total_inseridos"),
            processadas=ultimo.get("total_processadas") or ultimo.get("total"),
            eleicao_id=ultimo.get("eleicao_id"),
            duracao_s=round(duracao, 1),
        )


@router.get("/status")
def endpoint_status(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return status_importacao(db)


@router.get("/historico")
def endpoint_historico(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    logs = (
        db.query(ImportacaoLog)
        .order_by(ImportacaoLog.criado_em.desc())
        .limit(100)
        .all()
    )
    return [
        {
            "id":         str(l.id),
            "arquivo":    l.arquivo,
            "tipo":       l.tipo,
            "eleicao_id": str(l.eleicao_id) if l.eleicao_id else None,
            "status":     l.status,
            "mensagem":   l.mensagem,
            "inseridos":  l.inseridos,
            "processadas":l.processadas,
            "duracao_s":  l.duracao_s,
            "criado_em":  l.criado_em.isoformat() if l.criado_em else None,
        }
        for l in logs
    ]


@router.post("/municipios")
def endpoint_municipios(
    arquivo: UploadFile = File(...),
    forcar: bool = Form(False),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    tmp_path = _salvar_temp(arquivo)
    nome = arquivo.filename
    t0 = time.time()
    try:
        resultado = importar_municipios(db, tmp_path, forcar)
    except Exception as e:
        tmp_path.unlink(missing_ok=True)
        _gravar_log(db, tipo="municipios", arquivo=nome, status="erro",
                    mensagem=str(e), duracao_s=round(time.time() - t0, 1))
        raise HTTPException(status_code=422, detail=str(e))
    tmp_path.unlink(missing_ok=True)
    _invalidar_cache_eleicoes()
    _gravar_log(db, tipo="municipios", arquivo=nome, status="sucesso",
                inseridos=resultado.get("inseridos"),
                duracao_s=round(time.time() - t0, 1))
    return resultado


@router.post("/resultados")
def endpoint_resultados(
    arquivo: UploadFile = File(...),
    ano: int = Form(...),
    turno: int = Form(...),
    tipo: str = Form(...),
    candidato: str | None = Form(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    if tipo not in ("municipal", "federal", "estadual"):
        raise HTTPException(status_code=422, detail="Tipo deve ser municipal, federal ou estadual.")
    if turno not in (1, 2):
        raise HTTPException(status_code=422, detail="Turno deve ser 1 ou 2.")

    tmp_path = _salvar_temp(arquivo)
    nome = arquivo.filename

    def gen():
        yield from importar_resultados(db, tmp_path, ano, turno, tipo, candidato or None)
        _invalidar_cache_eleicoes()

    return StreamingResponse(
        _sse_stream(gen(), tmp_path, db=db, tipo="resultados", arquivo=nome),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/secoes")
def endpoint_secoes(
    arquivo: UploadFile = File(...),
    ano: int | None = Form(None),
    tipo: str | None = Form(None),
    cargo: str | None = Form(None),
    votavel: str | None = Form(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    if tipo and tipo not in ("municipal", "federal", "estadual"):
        raise HTTPException(status_code=422, detail="Tipo deve ser municipal, federal ou estadual.")

    tmp_path = _salvar_temp(arquivo)
    nome = arquivo.filename

    def gen():
        ultimo = None
        for update in importar_secoes(db, tmp_path, ano, tipo or None, cargo or None, votavel or None):
            ultimo = update
            yield update
        if ultimo and ultimo.get("tipo") == "concluido":
            for eleicao_id in (ultimo.get("turnos") or {}).values():
                try:
                    atualizar_resumo_cache(db, eleicao_id)
                except Exception:
                    pass
        _invalidar_cache_eleicoes()

    return StreamingResponse(
        _sse_stream(gen(), tmp_path, db=db, tipo="secoes", arquivo=nome),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
