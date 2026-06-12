"""add bairro tables

Revision ID: l9a0b1c2d3e4
Revises: k8f9a0b1c2d3
Create Date: 2026-06-12 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'l9a0b1c2d3e4'
down_revision = 'k8f9a0b1c2d3'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'bairro',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('nm_bairro',         sa.String(100), nullable=False),
        sa.Column('sg_uf',             sa.String(2),   nullable=False),
        sa.Column('cd_municipio_ibge', sa.String(7),   nullable=True),
        sa.Column('nm_municipio',      sa.String(100), nullable=True),
        sa.Column('criado_em', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_bairro_municipio', 'bairro', ['sg_uf', 'cd_municipio_ibge'])

    op.create_table(
        'bairro_local_votacao',
        sa.Column('bairro_id',        UUID(as_uuid=True), sa.ForeignKey('bairro.id', ondelete='CASCADE'), nullable=False),
        sa.Column('sg_uf',            sa.String(2),   nullable=False),
        sa.Column('cd_municipio_tse', sa.String(10),  nullable=False),
        sa.Column('nr_local_votacao', sa.Integer(),   nullable=False),
        sa.Column('nm_local_votacao', sa.String(200), nullable=True),
        sa.Column('ds_endereco',      sa.String(300), nullable=True),
    )
    op.create_primary_key(
        'pk_bairro_local_votacao', 'bairro_local_votacao',
        ['bairro_id', 'sg_uf', 'cd_municipio_tse', 'nr_local_votacao'],
    )


def downgrade():
    op.drop_table('bairro_local_votacao')
    op.drop_table('bairro')
