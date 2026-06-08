"""add importacao_log

Revision ID: i6d7e8f9a0b1
Revises: h5c6d7e8f9a0
Create Date: 2026-06-06 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'i6d7e8f9a0b1'
down_revision = 'h5c6d7e8f9a0'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'importacao_log',
        sa.Column('id',          UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('arquivo',     sa.String(),  nullable=True),
        sa.Column('tipo',        sa.String(20), nullable=False),
        sa.Column('eleicao_id',  UUID(as_uuid=True), nullable=True),
        sa.Column('status',      sa.String(10), nullable=False),
        sa.Column('mensagem',    sa.Text(),    nullable=True),
        sa.Column('inseridos',   sa.Integer(), nullable=True),
        sa.Column('processadas', sa.Integer(), nullable=True),
        sa.Column('duracao_s',   sa.Float(),   nullable=True),
        sa.Column('criado_em',   sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_importacao_log_criado_em', 'importacao_log', ['criado_em'])


def downgrade():
    op.drop_index('ix_importacao_log_criado_em', 'importacao_log')
    op.drop_table('importacao_log')
