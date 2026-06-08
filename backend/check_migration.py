from database import engine
from sqlalchemy import text
import time

with engine.connect() as conn:
    # Verifica coluna
    r = conn.execute(text(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name = 'votacao_secao' AND column_name = 'sg_uf'"
    )).fetchall()
    print("sg_uf existe:", bool(r))

    # Verifica índices
    r2 = conn.execute(text(
        "SELECT indexname FROM pg_indexes "
        "WHERE tablename = 'votacao_secao' AND indexname LIKE 'ix_vs%'"
    )).fetchall()
    print("indices ix_vs*:", [x[0] for x in r2])

    # Conta linhas
    r3 = conn.execute(text("SELECT COUNT(*) FROM votacao_secao")).scalar()
    r4 = conn.execute(text("SELECT COUNT(*) FROM votacao_secao WHERE sg_uf IS NOT NULL")).scalar()
    print(f"total: {r3:,}  com sg_uf: {r4:,}  sem sg_uf: {r3-r4:,}")

    # Testa velocidade da query de resumo
    t0 = time.time()
    conn.execute(text("""
        WITH cargo_principal AS (
            SELECT eleicao_id, MIN(cd_cargo) AS cd_cargo
            FROM votacao_secao WHERE cd_cargo IS NOT NULL
            GROUP BY eleicao_id
        ),
        sec_agg AS (
            SELECT s.eleicao_id,
                COUNT(DISTINCT s.cd_municipio_tse) AS municipios,
                COUNT(DISTINCT s.sg_uf) AS estados,
                SUM(CASE WHEN s.cd_cargo = cp.cd_cargo THEN s.qt_votos ELSE 0 END) AS votos_total
            FROM votacao_secao s
            LEFT JOIN cargo_principal cp ON cp.eleicao_id = s.eleicao_id
            GROUP BY s.eleicao_id
        )
        SELECT e.id, sa.municipios, sa.estados, sa.votos_total
        FROM eleicoes e LEFT JOIN sec_agg sa ON sa.eleicao_id = e.id
    """)).fetchall()
    print(f"query resumo: {time.time()-t0:.2f}s")
