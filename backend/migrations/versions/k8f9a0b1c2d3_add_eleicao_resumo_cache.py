"""add eleicao_resumo_cache table

Revision ID: k8f9a0b1c2d3
Revises: j7e8f9a0b1c2
Create Date: 2026-06-07 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'k8f9a0b1c2d3'
down_revision = 'j7e8f9a0b1c2'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'eleicao_resumo_cache',
        sa.Column('eleicao_id',  UUID(as_uuid=True), primary_key=True),
        sa.Column('municipios',  sa.Integer(), nullable=False, server_default='0'),
        sa.Column('estados',     sa.Integer(), nullable=False, server_default='0'),
        sa.Column('votos_total', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('atualizado_em', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    # Popula com os dados atuais (pode ser vazio se votacao_secao estiver vazia)
    op.execute("""
        INSERT INTO eleicao_resumo_cache (eleicao_id, municipios, estados, votos_total)
        WITH cargo_principal AS (
            SELECT eleicao_id, MIN(cd_cargo) AS cd_cargo
            FROM votacao_secao
            WHERE cd_cargo IS NOT NULL
            GROUP BY eleicao_id
        )
        SELECT
            s.eleicao_id,
            COUNT(DISTINCT s.cd_municipio_tse)                                            AS municipios,
            COUNT(DISTINCT s.sg_uf)                                                       AS estados,
            SUM(CASE WHEN s.cd_cargo = cp.cd_cargo THEN s.qt_votos ELSE 0 END)           AS votos_total
        FROM votacao_secao s
        LEFT JOIN cargo_principal cp ON cp.eleicao_id = s.eleicao_id
        GROUP BY s.eleicao_id
        ON CONFLICT (eleicao_id) DO UPDATE
            SET municipios   = EXCLUDED.municipios,
                estados      = EXCLUDED.estados,
                votos_total  = EXCLUDED.votos_total,
                atualizado_em = now()
    """)


def downgrade():
    op.drop_table('eleicao_resumo_cache')
