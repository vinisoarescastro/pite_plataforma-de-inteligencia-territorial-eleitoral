"""add nr_turno to votacao_secao

Revision ID: e2f3a4b5c6d7
Revises: d1e2f3a4b5c6
Create Date: 2026-06-05

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'e2f3a4b5c6d7'
down_revision: Union[str, Sequence[str], None] = 'd1e2f3a4b5c6'
branch_labels = None
depends_on    = None


def upgrade() -> None:
    # Remove a constraint antiga
    op.drop_constraint('uq_votacao_secao', 'votacao_secao', type_='unique')
    op.drop_index('ix_votacao_secao_zona',    table_name='votacao_secao')
    op.drop_index('ix_votacao_secao_votavel', table_name='votacao_secao')

    # Adiciona coluna nr_turno
    op.add_column('votacao_secao', sa.Column('nr_turno', sa.SmallInteger(), nullable=False, server_default='1'))

    # Recria constraint incluindo nr_turno
    op.create_unique_constraint(
        'uq_votacao_secao',
        'votacao_secao',
        ['eleicao_id', 'cd_municipio_tse', 'nr_zona', 'nr_secao', 'nr_votavel', 'cd_cargo', 'nr_turno'],
    )
    op.create_index('ix_votacao_secao_zona',    'votacao_secao', ['eleicao_id', 'cd_municipio_tse', 'nr_zona'])
    op.create_index('ix_votacao_secao_votavel', 'votacao_secao', ['eleicao_id', 'nr_votavel'])


def downgrade() -> None:
    op.drop_constraint('uq_votacao_secao', 'votacao_secao', type_='unique')
    op.drop_index('ix_votacao_secao_zona',    table_name='votacao_secao')
    op.drop_index('ix_votacao_secao_votavel', table_name='votacao_secao')
    op.drop_column('votacao_secao', 'nr_turno')
    op.create_unique_constraint(
        'uq_votacao_secao',
        'votacao_secao',
        ['eleicao_id', 'cd_municipio_tse', 'nr_zona', 'nr_secao', 'nr_votavel', 'cd_cargo'],
    )
    op.create_index('ix_votacao_secao_zona',    'votacao_secao', ['eleicao_id', 'cd_municipio_tse', 'nr_zona'])
    op.create_index('ix_votacao_secao_votavel', 'votacao_secao', ['eleicao_id', 'nr_votavel'])
