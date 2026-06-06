"""add partidos table and partido_id to candidaturas

Revision ID: g4b5c6d7e8f9
Revises: f3a4b5c6d7e8
Create Date: 2026-06-06 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'g4b5c6d7e8f9'
down_revision = 'f3a4b5c6d7e8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'partidos',
        sa.Column('id',         sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('sigla',      sa.String(20),  nullable=False, unique=True),
        sa.Column('nome',       sa.String(120), nullable=True),
        sa.Column('numero',     sa.Integer,     nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.add_column(
        'candidaturas',
        sa.Column('partido_id', sa.dialects.postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        'fk_candidatura_partido',
        'candidaturas', 'partidos',
        ['partido_id'], ['id'],
        ondelete='SET NULL',
    )


def downgrade() -> None:
    op.drop_constraint('fk_candidatura_partido', 'candidaturas', type_='foreignkey')
    op.drop_column('candidaturas', 'partido_id')
    op.drop_table('partidos')
