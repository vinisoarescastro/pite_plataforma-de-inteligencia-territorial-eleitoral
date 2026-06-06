"""make nr_candidato nullable

Revision ID: h5c6d7e8f9a0
Revises: g4b5c6d7e8f9
Create Date: 2026-06-06 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'h5c6d7e8f9a0'
down_revision = 'g4b5c6d7e8f9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column('candidatos', 'nr_candidato', existing_type=sa.String(10), nullable=True)
    op.alter_column('candidatos', 'cargo',        existing_type=sa.String(60), nullable=True)


def downgrade() -> None:
    op.alter_column('candidatos', 'cargo',        existing_type=sa.String(60), nullable=False)
    op.alter_column('candidatos', 'nr_candidato', existing_type=sa.String(10), nullable=False)
