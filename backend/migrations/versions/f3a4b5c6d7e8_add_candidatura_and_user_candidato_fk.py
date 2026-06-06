"""add candidatura table and user candidato_id fk

Revision ID: f3a4b5c6d7e8
Revises: e2f3a4b5c6d7
Create Date: 2026-06-06

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = 'f3a4b5c6d7e8'
down_revision: Union[str, None] = 'e2f3a4b5c6d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Tabela de candidaturas — une candidato + eleição + dados TSE
    op.create_table(
        'candidaturas',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('candidato_id', UUID(as_uuid=True), sa.ForeignKey('candidatos.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('eleicao_id',   UUID(as_uuid=True), sa.ForeignKey('eleicoes.id',   ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('sq_candidato_tse', sa.BigInteger, nullable=True),
        sa.Column('nr_votavel',   sa.String(10),  nullable=True),
        sa.Column('nm_votavel',   sa.String(160), nullable=True),
        sa.Column('ds_cargo',     sa.String(60),  nullable=True),
        sa.Column('situacao',     sa.String(30),  nullable=True),
        sa.Column('created_at',   sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.UniqueConstraint('candidato_id', 'eleicao_id', name='uq_candidatura_candidato_eleicao'),
    )

    # Adiciona FK candidato_id na tabela users (nullable — admin não precisa)
    op.add_column('users', sa.Column('candidato_id', UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        'fk_users_candidato_id',
        'users', 'candidatos',
        ['candidato_id'], ['id'],
        ondelete='SET NULL',
    )


def downgrade() -> None:
    op.drop_constraint('fk_users_candidato_id', 'users', type_='foreignkey')
    op.drop_column('users', 'candidato_id')
    op.drop_table('candidaturas')
