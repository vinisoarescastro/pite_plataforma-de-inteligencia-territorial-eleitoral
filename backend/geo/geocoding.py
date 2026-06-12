"""
Geocodificação de locais de votação via Nominatim (OSM).
Roda como BackgroundTask — cria a própria sessão DB e respeita o rate limit
de 1 req/s do Nominatim.
"""
import json
import time
import urllib.request
import urllib.parse
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import SessionLocal

# Mapa em memória dos jobs em andamento: "{sg_uf}_{cd_municipio_tse}" → True
_running: set[str] = set()

NOMINATIM = "https://nominatim.openstreetmap.org/search"
UA = "PITE/1.0 (plataforma-inteligencia-territorial-eleitoral; contato: dev@pite.local)"
RATE_SLEEP = 1.1  # segundos entre chamadas (máx 1 req/s conforme ToS Nominatim)


def job_key(sg_uf: str, cd_municipio_tse: str) -> str:
    return f"{sg_uf}_{cd_municipio_tse}"


def is_running(sg_uf: str, cd_municipio_tse: str) -> bool:
    return job_key(sg_uf, cd_municipio_tse) in _running


def _search(query: str) -> tuple[float, float] | None:
    """Chama o Nominatim e retorna (lat, lon) ou None."""
    params = urllib.parse.urlencode({
        "q": query, "format": "json", "limit": 1,
        "countrycodes": "br", "addressdetails": "0",
    })
    url = f"{NOMINATIM}?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
            if data:
                return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception:
        pass
    return None


def _geocodificar_impl(sg_uf: str, cd_municipio_tse: str, nm_municipio: str, db: Session) -> None:
    """Núcleo do job de geocodificação (roda em thread separada)."""
    # 1. Coleta todos os locais únicos do município
    locais = db.execute(text("""
        SELECT DISTINCT nr_local_votacao,
               MAX(nm_local_votacao) AS nm_local_votacao,
               MAX(ds_endereco)      AS ds_endereco
        FROM votacao_secao
        WHERE sg_uf = :uf AND cd_municipio_tse = :cd
          AND nr_local_votacao IS NOT NULL
        GROUP BY nr_local_votacao
        ORDER BY nr_local_votacao
    """), {"uf": sg_uf, "cd": cd_municipio_tse}).fetchall()

    # 2. Insere como 'pendente' se ainda não existir
    for l in locais:
        db.execute(text("""
            INSERT INTO local_votacao_geo
                (sg_uf, cd_municipio_tse, nr_local_votacao, nm_local_votacao, ds_endereco, status)
            VALUES (:uf, :cd, :nr, :nm, :ds, 'pendente')
            ON CONFLICT (sg_uf, cd_municipio_tse, nr_local_votacao) DO NOTHING
        """), {"uf": sg_uf, "cd": cd_municipio_tse, "nr": l.nr_local_votacao,
               "nm": l.nm_local_votacao, "ds": l.ds_endereco})
    db.commit()

    # 3. Geocodifica os pendentes
    pendentes = db.execute(text("""
        SELECT nr_local_votacao, nm_local_votacao, ds_endereco
        FROM local_votacao_geo
        WHERE sg_uf = :uf AND cd_municipio_tse = :cd AND status = 'pendente'
        ORDER BY nr_local_votacao
    """), {"uf": sg_uf, "cd": cd_municipio_tse}).fetchall()

    for l in pendentes:
        coords = None

        # Tentativa 1: endereço completo
        if l.ds_endereco:
            query = f"{l.ds_endereco}, {nm_municipio}, {sg_uf}, Brasil"
            coords = _search(query)
            time.sleep(RATE_SLEEP)

        # Tentativa 2 (fallback): só o nome do local
        if coords is None and l.nm_local_votacao:
            query = f"{l.nm_local_votacao}, {nm_municipio}, {sg_uf}, Brasil"
            coords = _search(query)
            time.sleep(RATE_SLEEP)
        elif coords is None:
            time.sleep(RATE_SLEEP)

        if coords:
            lat, lon = coords
            db.execute(text("""
                UPDATE local_votacao_geo
                SET lat = :lat, lon = :lon,
                    geom = ST_SetSRID(ST_MakePoint(:lon, :lat), 4326),
                    status = 'ok',
                    geocodificado_em = now()
                WHERE sg_uf = :uf AND cd_municipio_tse = :cd AND nr_local_votacao = :nr
            """), {"lat": lat, "lon": lon, "uf": sg_uf, "cd": cd_municipio_tse, "nr": l.nr_local_votacao})
        else:
            db.execute(text("""
                UPDATE local_votacao_geo
                SET status = 'erro', geocodificado_em = now()
                WHERE sg_uf = :uf AND cd_municipio_tse = :cd AND nr_local_votacao = :nr
            """), {"uf": sg_uf, "cd": cd_municipio_tse, "nr": l.nr_local_votacao})

        db.commit()


def geocodificar_bg(sg_uf: str, cd_municipio_tse: str, nm_municipio: str) -> None:
    """Entry-point do BackgroundTask. Cria sessão DB própria."""
    db = SessionLocal()
    try:
        _geocodificar_impl(sg_uf, cd_municipio_tse, nm_municipio, db)
    finally:
        db.close()
        _running.discard(job_key(sg_uf, cd_municipio_tse))
