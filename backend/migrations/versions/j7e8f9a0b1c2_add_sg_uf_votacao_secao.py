"""add sg_uf to votacao_secao and cargo index

Revision ID: j7e8f9a0b1c2
Revises: i6d7e8f9a0b1
Create Date: 2026-06-07 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'j7e8f9a0b1c2'
down_revision = 'i6d7e8f9a0b1'
branch_labels = None
depends_on = None


def upgrade():
    # Adiciona coluna sg_uf diretamente em votacao_secao para evitar JOIN caro
    op.add_column('votacao_secao', sa.Column('sg_uf', sa.String(2), nullable=True))

    # Popula a partir da tabela de municípios (UPDATE único, roda uma vez)
    op.execute("""
        UPDATE votacao_secao s
        SET sg_uf = m.sg_uf
        FROM municipio_tse_ibge m
        WHERE m.cd_tse = s.cd_municipio_tse
    """)

    # Índice composto para filtrar votos por cargo principal (corrige contagem)
    op.create_index('ix_vs_eleicao_cargo', 'votacao_secao', ['eleicao_id', 'cd_cargo'])
    # Índice para agregar por UF sem JOIN
    op.create_index('ix_vs_eleicao_sg_uf', 'votacao_secao', ['eleicao_id', 'sg_uf'])


def downgrade():
    op.drop_index('ix_vs_eleicao_sg_uf', 'votacao_secao')
    op.drop_index('ix_vs_eleicao_cargo', 'votacao_secao')
    op.drop_column('votacao_secao', 'sg_uf')
