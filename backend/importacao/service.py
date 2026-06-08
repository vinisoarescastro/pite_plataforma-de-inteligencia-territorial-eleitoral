"""
Lógica de importação de dados eleitorais do TSE.
As funções principais são generators que produzem dicts de progresso via SSE.
"""
import csv
import io
import time
from pathlib import Path
from typing import Generator

import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import engine
from models.eleitoral import MunicipioTSE, Eleicao, Candidato, ResultadoEleitoral

Update = dict
Stream = Generator[Update, None, None]

CHUNKSIZE = 50_000


# ── Status geral de importação ──────────────────────────────────────────────

def status_importacao(db: Session) -> list[dict]:
    sql = text("""
        SELECT
            e.id::text  AS eleicao_id,
            e.descricao,
            e.ano,
            e.turno,
            e.tipo,
            COALESCE(r.estados,           0) AS estados,
            COALESCE(r.municipios,        0) AS municipios,
            COALESCE(r.registros,         0) AS registros,
            COALESCE(s.secoes_municipios, 0) AS secoes_municipios,
            COALESCE(s.secoes_votos,      0) AS secoes_votos,
            COALESCE(s.secoes_registros,  0) AS secoes_registros
        FROM eleicoes e
        LEFT JOIN (
            SELECT
                eleicao_id,
                COUNT(DISTINCT LEFT(cd_municipio_ibge, 2)) AS estados,
                COUNT(DISTINCT cd_municipio_ibge)          AS municipios,
                COUNT(*)                                   AS registros
            FROM resultados_eleitorais
            GROUP BY eleicao_id
        ) r ON r.eleicao_id = e.id
        LEFT JOIN (
            SELECT
                eleicao_id,
                COUNT(DISTINCT cd_municipio_tse) AS secoes_municipios,
                COALESCE(SUM(qt_votos), 0)       AS secoes_votos,
                COUNT(*)                         AS secoes_registros
            FROM votacao_secao
            GROUP BY eleicao_id
        ) s ON s.eleicao_id = e.id
        ORDER BY e.ano DESC, e.turno
    """)
    rows = db.execute(sql).mappings().all()
    return [dict(r) for r in rows]


def _contar_linhas(path: Path) -> int:
    n = 0
    with open(path, "rb") as f:
        for _ in f:
            n += 1
    return max(n - 1, 0)


def _eta(processadas: int, total: int, inicio: float) -> str | None:
    if processadas == 0:
        return None
    elapsed = time.time() - inicio
    rate = processadas / elapsed
    restante = int((total - processadas) / rate) if rate > 0 else None
    if restante is None:
        return None
    if restante < 60:
        return f"{restante}s"
    return f"{restante // 60}min {restante % 60}s"


def _copy_df_to_temp(cur, df: pd.DataFrame, table: str, columns: list[str]):
    """COPY de um DataFrame para tabela temporária via psycopg2 copy_expert."""
    buf = io.StringIO()
    df[columns].to_csv(buf, index=False, header=False, na_rep='\\N')
    buf.seek(0)
    cols_sql = ", ".join(columns)
    cur.copy_expert(
        f"COPY {table} ({cols_sql}) FROM STDIN WITH (FORMAT CSV, NULL '\\N')",
        buf,
    )


# ── Municípios TSE ↔ IBGE ───────────────────────────────────────────────────

def importar_municipios(db: Session, csv_path: Path, forcar: bool = False) -> Update:
    existentes = db.query(MunicipioTSE).count()
    if existentes > 0 and not forcar:
        return {"tipo": "concluido", "inseridos": 0, "aviso": f"Tabela já tem {existentes} registros. Use 'forçar' para reimportar."}

    if forcar:
        db.query(MunicipioTSE).delete()
        db.flush()

    inseridos = 0
    with open(csv_path, encoding="latin1", newline="") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            db.add(MunicipioTSE(
                cd_tse       = row["CD_MUNICIPIO_TSE"].strip().strip('"'),
                cd_ibge      = str(row["CD_MUNICIPIO_IBGE"]).strip().strip('"'),
                sg_uf        = row["SG_UF"].strip().strip('"'),
                nm_municipio = row["NM_MUNICIPIO_IBGE"].strip().strip('"'),
            ))
            inseridos += 1
    db.commit()
    return {"tipo": "concluido", "inseridos": inseridos}


# ── Resultados por município ────────────────────────────────────────────────

def importar_resultados(
    db: Session,
    csv_path: Path,
    ano: int,
    turno: int,
    tipo: str,
    candidato: str | None = None,
) -> Stream:
    mapa_ibge = {str(m.cd_tse): str(m.cd_ibge) for m in db.query(MunicipioTSE).all()}
    if not mapa_ibge:
        raise ValueError("Tabela municipio_tse_ibge está vazia. Importe os municípios primeiro.")

    total = _contar_linhas(csv_path)
    yield {"tipo": "inicio", "total": total}

    df = pd.read_csv(csv_path, sep=";", encoding="latin1", dtype=str, low_memory=False)
    df.columns = [c.strip().upper() for c in df.columns]

    if candidato:
        todos = sorted(df["NM_CANDIDATO"].str.strip().unique().tolist()) if "NM_CANDIDATO" in df.columns else []
        df = df[df["NM_CANDIDATO"].str.strip().str.upper() == candidato.strip().upper()]
        if df.empty:
            raise ValueError(f'Nenhuma linha encontrada para "{candidato}". Disponíveis: {todos[:20]}')

    eleicao = db.query(Eleicao).filter_by(ano=ano, turno=turno, tipo=tipo).first()
    if not eleicao:
        eleicao = Eleicao(ano=ano, turno=turno, tipo=tipo, descricao=f"Eleições {tipo.capitalize()} {ano} - {turno}º turno")
        db.add(eleicao)
        db.flush()
        db.commit()

    cols = ["NM_CANDIDATO", "NR_CANDIDATO", "NM_PARTIDO", "SG_PARTIDO",
            "SG_UF", "CD_MUNICIPIO", "DS_CARGO",
            "QT_VOTOS_NOMINAIS", "QT_VOTOS_VALIDOS", "QT_APTOS", "QT_ABSTENCOES"]
    df = df[[c for c in cols if c in df.columns]].copy()

    for col in ["QT_VOTOS_NOMINAIS", "QT_VOTOS_VALIDOS", "QT_APTOS", "QT_ABSTENCOES"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)

    group_cols = ["NM_CANDIDATO", "NR_CANDIDATO", "SG_UF", "CD_MUNICIPIO"]
    for extra in ["NM_PARTIDO", "SG_PARTIDO", "DS_CARGO"]:
        if extra in df.columns:
            group_cols.append(extra)

    sum_cols = [c for c in ["QT_VOTOS_NOMINAIS", "QT_VOTOS_VALIDOS", "QT_APTOS", "QT_ABSTENCOES"] if c in df.columns]
    df_mun = df.groupby(group_cols, as_index=False)[sum_cols].sum()

    yield {"tipo": "progresso", "processadas": 0, "total": len(df_mun), "inseridos": 0, "fase": "Resolvendo candidatos…"}

    # Bulk-carrega todos os candidatos existentes (evita N+1 queries)
    cands_existentes = {
        f'{c.nr_candidato}|{c.sg_uf}|{c.cargo}': c
        for c in db.query(Candidato).all()
    }

    novos_cands = []
    chaves_vistas: set[str] = set()
    for row in df_mun.itertuples(index=False):
        nr    = str(getattr(row, "NR_CANDIDATO", "") or "").strip()
        uf    = str(getattr(row, "SG_UF", "") or "").strip() or None
        cargo = str(getattr(row, "DS_CARGO", "") or "").strip() or None
        chave = f"{nr}|{uf}|{cargo}"
        if chave not in cands_existentes and chave not in chaves_vistas:
            chaves_vistas.add(chave)
            novos_cands.append(Candidato(
                nr_candidato=nr,
                nm_candidato=str(getattr(row, "NM_CANDIDATO", "")).strip(),
                nm_partido=str(getattr(row, "NM_PARTIDO", "") or "").strip() or None,
                sg_partido=str(getattr(row, "SG_PARTIDO", "") or "").strip() or None,
                sg_uf=uf, cargo=cargo,
            ))

    if novos_cands:
        db.bulk_save_objects(novos_cands)
        db.flush()
        for c in db.query(Candidato).filter(
            Candidato.nr_candidato.in_({c.nr_candidato for c in novos_cands})
        ).all():
            cands_existentes[f'{c.nr_candidato}|{c.sg_uf}|{c.cargo}'] = c

    candidatos_criados = len(novos_cands)

    yield {"tipo": "progresso", "processadas": 0, "total": len(df_mun), "inseridos": 0, "fase": "Inserindo via COPY…"}

    # Monta DataFrame de resultados
    registros = []
    sem_ibge = 0
    inicio = time.time()

    for i, row in enumerate(df_mun.itertuples(index=False)):
        nr    = str(getattr(row, "NR_CANDIDATO", "") or "").strip()
        uf    = str(getattr(row, "SG_UF", "") or "").strip() or None
        cargo = str(getattr(row, "DS_CARGO", "") or "").strip() or None
        cd_tse = str(getattr(row, "CD_MUNICIPIO", "") or "").strip()

        cd_ibge = mapa_ibge.get(cd_tse)
        if not cd_ibge:
            sem_ibge += 1
            continue

        cand = cands_existentes.get(f"{nr}|{uf}|{cargo}")
        if not cand:
            continue

        registros.append({
            "eleicao_id":        str(eleicao.id),
            "candidato_id":      str(cand.id),
            "cd_municipio_ibge": cd_ibge,
            "qt_votos_nominais": int(getattr(row, "QT_VOTOS_NOMINAIS", 0) or 0),
            "qt_votos_validos":  int(getattr(row, "QT_VOTOS_VALIDOS",  0) or 0) or None,
            "qt_aptos":          int(getattr(row, "QT_APTOS",          0) or 0) or None,
            "qt_abstencoes":     int(getattr(row, "QT_ABSTENCOES",     0) or 0) or None,
        })

        if (i + 1) % 5_000 == 0:
            yield {
                "tipo": "progresso",
                "processadas": i + 1,
                "total": len(df_mun),
                "inseridos": 0,
                "eta": _eta(i + 1, len(df_mun), inicio),
                "fase": "Preparando dados…",
            }

    if not registros:
        db.commit()
        yield {"tipo": "concluido", "inseridos": 0, "sem_ibge": sem_ibge, "candidatos_criados": candidatos_criados,
               "eleicao_id": str(eleicao.id), "descricao": eleicao.descricao}
        return

    df_reg = pd.DataFrame(registros)
    cols_res = ["eleicao_id", "candidato_id", "cd_municipio_ibge",
                "qt_votos_nominais", "qt_votos_validos", "qt_aptos", "qt_abstencoes"]

    # Conexão psycopg2 dedicada para COPY (independente do pool da sessão)
    raw_conn = engine.raw_connection()
    try:
        with raw_conn.cursor() as cur:
            cur.execute("""
                DROP TABLE IF EXISTS tmp_resultados;
                CREATE TEMP TABLE tmp_resultados (
                    eleicao_id        TEXT,
                    candidato_id      TEXT,
                    cd_municipio_ibge TEXT,
                    qt_votos_nominais INT,
                    qt_votos_validos  INT,
                    qt_aptos          INT,
                    qt_abstencoes     INT
                )
            """)
            _copy_df_to_temp(cur, df_reg, "tmp_resultados", cols_res)
            cur.execute("""
                INSERT INTO resultados_eleitorais
                    (eleicao_id, candidato_id, cd_municipio_ibge,
                     qt_votos_nominais, qt_votos_validos, qt_aptos, qt_abstencoes)
                SELECT eleicao_id::uuid, candidato_id::uuid, cd_municipio_ibge,
                       qt_votos_nominais,
                       NULLIF(qt_votos_validos, 0),
                       NULLIF(qt_aptos, 0),
                       NULLIF(qt_abstencoes, 0)
                FROM tmp_resultados
                ON CONFLICT ON CONSTRAINT uq_resultado_por_municipio DO NOTHING
            """)
            inseridos = cur.rowcount
        raw_conn.commit()
    finally:
        raw_conn.close()

    db.commit()
    yield {
        "tipo": "concluido",
        "inseridos": inseridos,
        "sem_ibge": sem_ibge,
        "candidatos_criados": candidatos_criados,
        "eleicao_id": str(eleicao.id),
        "descricao": eleicao.descricao,
    }


# ── Votação por seção ───────────────────────────────────────────────────────

MAPA_TIPO = {
    "MUNICIPAL": "municipal", "FEDERAL": "federal", "ESTADUAL": "estadual",
    "M": "municipal", "F": "federal", "E": "estadual",
}

COLS_SECAO = [
    "eleicao_id", "sg_uf", "cd_municipio_tse", "nr_turno", "nr_zona", "nr_secao",
    "nr_local_votacao", "nm_local_votacao", "ds_endereco",
    "nr_votavel", "nm_votavel", "cd_cargo", "ds_cargo", "sq_candidato", "qt_votos",
]


def importar_secoes(
    db: Session,
    csv_path: Path,
    ano: int | None = None,
    tipo: str | None = None,
    cargo: str | None = None,
    votavel: str | None = None,
) -> Stream:
    total = _contar_linhas(csv_path)
    yield {"tipo": "inicio", "total": total}

    eleicoes_cache: dict[int, Eleicao] = {}
    total_processadas = 0
    total_inseridos   = 0
    inicio            = time.time()

    # Conexão psycopg2 dedicada — persiste durante toda a importação,
    # independente do pool da sessão SQLAlchemy (db).
    # A tabela temporária vive nessa conexão até raw_conn.close().
    raw_conn = engine.raw_connection()
    try:
        with raw_conn.cursor() as cur:
            cur.execute("""
                DROP TABLE IF EXISTS tmp_votacao_secao;
                CREATE TEMP TABLE tmp_votacao_secao (
                    eleicao_id        TEXT,
                    sg_uf             TEXT,
                    cd_municipio_tse  TEXT,
                    nr_turno          SMALLINT,
                    nr_zona           SMALLINT,
                    nr_secao          SMALLINT,
                    nr_local_votacao  INT,
                    nm_local_votacao  TEXT,
                    ds_endereco       TEXT,
                    nr_votavel        TEXT,
                    nm_votavel        TEXT,
                    cd_cargo          SMALLINT,
                    ds_cargo          TEXT,
                    sq_candidato      TEXT,
                    qt_votos          INT
                )
            """)
        raw_conn.commit()

        reader = pd.read_csv(
            csv_path, sep=";", encoding="latin1", dtype=str,
            low_memory=False, chunksize=CHUNKSIZE,
        )

        for chunk in reader:
            chunk.columns = [c.strip().upper() for c in chunk.columns]

            if cargo:
                chunk = chunk[chunk["DS_CARGO"].str.strip().str.upper() == cargo.upper()]
            if votavel:
                chunk = chunk[chunk["NR_VOTAVEL"].str.strip() == votavel.strip()]
            if chunk.empty:
                continue

            total_processadas += len(chunk)

            for col, default in [
                ("QT_VOTOS", 0), ("NR_ZONA", 0), ("NR_SECAO", 0),
                ("NR_TURNO", 1), ("NR_LOCAL_VOTACAO", 0), ("CD_CARGO", pd.NA),
            ]:
                chunk[col] = pd.to_numeric(chunk.get(col, default), errors="coerce")

            chunk["NR_TURNO"] = chunk["NR_TURNO"].fillna(1).astype(int)

            # Detecta ano e tipo
            ano_efetivo = ano
            if ano_efetivo is None:
                if "ANO_ELEICAO" not in chunk.columns:
                    raise ValueError("Coluna ANO_ELEICAO não encontrada. Informe o ano manualmente.")
                ano_efetivo = int(chunk["ANO_ELEICAO"].dropna().iloc[0])

            tipo_efetivo = tipo
            if tipo_efetivo is None:
                if "TP_ABRANGENCIA" not in chunk.columns:
                    raise ValueError("Coluna TP_ABRANGENCIA não encontrada. Informe o tipo manualmente.")
                tp_raw = chunk["TP_ABRANGENCIA"].dropna().iloc[0].strip().upper()
                tipo_efetivo = MAPA_TIPO.get(tp_raw)
                if tipo_efetivo is None:
                    raise ValueError(f'Valor desconhecido em TP_ABRANGENCIA: "{tp_raw}". Informe o tipo manualmente.')

            # Garante eleições no banco via sessão SQLAlchemy normal
            for turno_val in chunk["NR_TURNO"].unique():
                t = int(turno_val)
                if t not in eleicoes_cache:
                    el = db.query(Eleicao).filter_by(ano=ano_efetivo, turno=t, tipo=tipo_efetivo).first()
                    if not el:
                        el = Eleicao(
                            ano=ano_efetivo, turno=t, tipo=tipo_efetivo,
                            descricao=f"Eleições {tipo_efetivo.capitalize()} {ano_efetivo} - {t}º turno",
                        )
                        db.add(el)
                        db.flush()
                    eleicoes_cache[t] = el
            db.commit()

            # Monta DataFrame de saída vetorizado (sem iterrows)
            turno_to_eid = {t: str(el.id) for t, el in eleicoes_cache.items()}

            out = pd.DataFrame()
            out["eleicao_id"]       = chunk["NR_TURNO"].map(turno_to_eid)
            out["sg_uf"]            = chunk.get("SG_UF", pd.Series(dtype=str)).str.strip().replace("", None)
            out["cd_municipio_tse"] = chunk.get("CD_MUNICIPIO", pd.Series(dtype=str)).str.strip()
            out["nr_turno"]         = chunk["NR_TURNO"].astype(int)
            out["nr_zona"]          = chunk["NR_ZONA"].fillna(0).astype(int)
            out["nr_secao"]         = chunk["NR_SECAO"].fillna(0).astype(int)
            out["nr_local_votacao"] = chunk["NR_LOCAL_VOTACAO"].where(
                chunk["NR_LOCAL_VOTACAO"].notna() & (chunk["NR_LOCAL_VOTACAO"] != 0)
            )
            out["nm_local_votacao"] = chunk.get("NM_LOCAL_VOTACAO", pd.Series(dtype=str)).str.strip().replace("", None)
            out["ds_endereco"]      = chunk.get("DS_LOCAL_VOTACAO_ENDERECO", pd.Series(dtype=str)).str.strip().replace("", None)
            out["nr_votavel"]       = chunk.get("NR_VOTAVEL", pd.Series(dtype=str)).str.strip()
            out["nm_votavel"]       = chunk.get("NM_VOTAVEL", pd.Series(dtype=str)).str.strip()
            out["cd_cargo"]         = chunk["CD_CARGO"].where(chunk["CD_CARGO"].notna())
            out["ds_cargo"]         = chunk.get("DS_CARGO", pd.Series(dtype=str)).str.strip().replace("", None)
            out["sq_candidato"]     = chunk.get("SQ_CANDIDATO", pd.Series(dtype=str)).str.strip().replace("", None)
            out["qt_votos"]         = chunk["QT_VOTOS"].fillna(0).astype(int)

            # COPY para temp + INSERT com dedup — mesma conexão dedicada
            with raw_conn.cursor() as cur:
                _copy_df_to_temp(cur, out, "tmp_votacao_secao", COLS_SECAO)
                cur.execute("""
                    INSERT INTO votacao_secao
                        (eleicao_id, sg_uf, cd_municipio_tse, nr_turno, nr_zona, nr_secao,
                         nr_local_votacao, nm_local_votacao, ds_endereco,
                         nr_votavel, nm_votavel, cd_cargo, ds_cargo, sq_candidato, qt_votos)
                    SELECT
                        eleicao_id::uuid, sg_uf, cd_municipio_tse, nr_turno, nr_zona, nr_secao,
                        nr_local_votacao::int, nm_local_votacao, ds_endereco,
                        nr_votavel, nm_votavel, cd_cargo::smallint, ds_cargo, sq_candidato, qt_votos
                    FROM tmp_votacao_secao
                    ON CONFLICT ON CONSTRAINT uq_votacao_secao DO NOTHING
                """)
                inseridos_chunk = cur.rowcount
                cur.execute("TRUNCATE tmp_votacao_secao")
            raw_conn.commit()
            total_inseridos += inseridos_chunk

            yield {
                "tipo": "progresso",
                "processadas": total_processadas,
                "total": total,
                "inseridos": total_inseridos,
                "eta": _eta(total_processadas, total, inicio),
                "fase": "Inserindo seções…",
            }

    finally:
        raw_conn.close()

    yield {
        "tipo": "concluido",
        "total_processadas": total_processadas,
        "inseridos": total_inseridos,
        "turnos": {str(t): str(el.id) for t, el in sorted(eleicoes_cache.items())},
    }
