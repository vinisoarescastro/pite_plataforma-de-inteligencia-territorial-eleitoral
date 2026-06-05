"""create electoral tables

Revision ID: c3d4e5f6a7b8
Revises: b9e3f1a2c847
Create Date: 2026-06-05

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, Sequence[str], None] = 'b9e3f1a2c847'
branch_labels = None
depends_on    = None


def upgrade() -> None:
    # ── municipio_tse_ibge ────────────────────────────────────────
    op.create_table(
        'municipio_tse_ibge',
        sa.Column('id',           sa.Integer(),     primary_key=True, autoincrement=True),
        sa.Column('cd_tse',       sa.String(10),    nullable=False),
        sa.Column('cd_ibge',      sa.String(10),    nullable=False),
        sa.Column('sg_uf',        sa.String(2),     nullable=False),
        sa.Column('nm_municipio', sa.String(120),   nullable=False),
        sa.UniqueConstraint('cd_tse',  name='uq_municipio_cd_tse'),
        sa.UniqueConstraint('cd_ibge', name='uq_municipio_cd_ibge'),
    )
    op.create_index('ix_municipio_tse_cd_tse',  'municipio_tse_ibge', ['cd_tse'])
    op.create_index('ix_municipio_tse_cd_ibge', 'municipio_tse_ibge', ['cd_ibge'])

    # ── eleicoes ──────────────────────────────────────────────────
    op.create_table(
        'eleicoes',
        sa.Column('id',         postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('ano',        sa.SmallInteger(), nullable=False),
        sa.Column('turno',      sa.SmallInteger(), nullable=False, server_default='1'),
        sa.Column('tipo',       sa.String(20),     nullable=False),
        sa.Column('descricao',  sa.String(120),    nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint('ano', 'turno', 'tipo', name='uq_eleicao'),
    )

    # ── candidatos ────────────────────────────────────────────────
    op.create_table(
        'candidatos',
        sa.Column('id',           postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('nr_candidato', sa.String(10),  nullable=False),
        sa.Column('nm_candidato', sa.String(160), nullable=False),
        sa.Column('nm_partido',   sa.String(80),  nullable=True),
        sa.Column('sg_partido',   sa.String(20),  nullable=True),
        sa.Column('sg_uf',        sa.String(2),   nullable=True),
        sa.Column('cargo',        sa.String(60),  nullable=True),
        sa.Column('created_at',   sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── resultados_eleitorais ─────────────────────────────────────
    op.create_table(
        'resultados_eleitorais',
        sa.Column('id',                postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('eleicao_id',        postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('candidato_id',      postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('cd_municipio_ibge', sa.String(10),  nullable=False),
        sa.Column('qt_votos_nominais', sa.Integer(),   nullable=False, server_default='0'),
        sa.Column('qt_votos_validos',  sa.Integer(),   nullable=True),
        sa.Column('qt_aptos',          sa.Integer(),   nullable=True),
        sa.Column('qt_abstencoes',     sa.Integer(),   nullable=True),
        sa.Column('created_at',        sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['eleicao_id'],   ['eleicoes.id'],   ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['candidato_id'], ['candidatos.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('eleicao_id', 'candidato_id', 'cd_municipio_ibge', name='uq_resultado_por_municipio'),
    )
    op.create_index('ix_resultado_municipio_ibge', 'resultados_eleitorais', ['cd_municipio_ibge'])


def downgrade() -> None:
    op.drop_table('resultados_eleitorais')
    op.drop_table('candidatos')
    op.drop_table('eleicoes')
    op.drop_table('municipio_tse_ibge')
