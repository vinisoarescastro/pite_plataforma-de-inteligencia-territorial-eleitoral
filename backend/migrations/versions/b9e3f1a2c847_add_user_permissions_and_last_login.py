"""add user permissions and last login

Revision ID: b9e3f1a2c847
Revises: 0f08b7443f87
Create Date: 2026-06-05

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'b9e3f1a2c847'
down_revision: Union[str, Sequence[str], None] = '0f08b7443f87'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('candidate_name', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('can_export', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('users', sa.Column('can_compare', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('last_login', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'last_login')
    op.drop_column('users', 'can_compare')
    op.drop_column('users', 'can_export')
    op.drop_column('users', 'candidate_name')
