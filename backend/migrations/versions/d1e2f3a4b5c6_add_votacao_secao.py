"""add votacao_secao table

Revision ID: d1e2f3a4b5c6
Revises: c3d4e5f6a7b8
Create Date: 2026-06-05

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'd1e2f3a4b5c6'
down_revision: Union[str, Sequence[str], None] = 'c3d4e5f6a7b8'
branch_labels = None
depends_on    = None


def upgrade() -> None:
    op.create_table(
        'votacao_secao',
        sa.Column('id',              sa.BigInteger(),  primary_key=True, autoincrement=True),
        sa.Column('eleicao_id',      postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('cd_municipio_tse',sa.String(10),   nullable=False, index=True),
        sa.Column('nr_zona',         sa.SmallInteger(),nullable=False),
        sa.Column('nr_secao',        sa.SmallInteger(),nullable=False),
        sa.Column('nr_local_votacao',sa.Integer(),    nullable=True),
        sa.Column('nm_local_votacao',sa.String(200),  nullable=True),
        sa.Column('ds_endereco',     sa.String(300),  nullable=True),
        sa.Column('nr_votavel',      sa.String(10),   nullable=False),
        sa.Column('nm_votavel',      sa.String(160),  nullable=False),
        sa.Column('cd_cargo',        sa.SmallInteger(),nullable=True),
        sa.Column('ds_cargo',        sa.String(60),   nullable=True),
        sa.Column('sq_candidato',    sa.String(20),   nullable=True),
        sa.Column('qt_votos',        sa.Integer(),    nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['eleicao_id'], ['eleicoes.id'], ondelete='CASCADE'),
        sa.UniqueConstraint(
            'eleicao_id', 'cd_municipio_tse', 'nr_zona', 'nr_secao', 'nr_votavel', 'cd_cargo',
            name='uq_votacao_secao'
        ),
    )
    op.create_index('ix_votacao_secao_zona',     'votacao_secao', ['eleicao_id', 'cd_municipio_tse', 'nr_zona'])
    op.create_index('ix_votacao_secao_votavel',  'votacao_secao', ['eleicao_id', 'nr_votavel'])


def downgrade() -> None:
    op.drop_table('votacao_secao')
