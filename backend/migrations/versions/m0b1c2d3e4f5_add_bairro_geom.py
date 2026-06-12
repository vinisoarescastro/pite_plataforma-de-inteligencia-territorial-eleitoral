"""add geom column to bairro

Revision ID: m0b1c2d3e4f5
Revises: l9a0b1c2d3e4
Create Date: 2026-06-12 00:00:00.000000
"""
from alembic import op

revision = 'm0b1c2d3e4f5'
down_revision = 'l9a0b1c2d3e4'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE bairro ADD COLUMN geom GEOMETRY(GEOMETRY, 4326)")
    op.execute("CREATE INDEX ix_bairro_geom ON bairro USING GIST(geom)")


def downgrade():
    op.execute("DROP INDEX IF EXISTS ix_bairro_geom")
    op.execute("ALTER TABLE bairro DROP COLUMN IF EXISTS geom")
