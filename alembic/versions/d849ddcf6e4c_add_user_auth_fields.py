"""add_user_auth_fields

Revision ID: d849ddcf6e4c
Revises: 45444fd36e63
Create Date: 2025-02-21 20:57:46.537721

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd849ddcf6e4c'
down_revision: Union[str, None] = '45444fd36e63'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column('users', sa.Column('hashed_password', sa.String(), nullable=True))
    op.add_column('users', sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False))

def downgrade():
    op.drop_column('users', 'is_active')
    op.drop_column('users', 'hashed_password')