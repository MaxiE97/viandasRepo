"""Add is_active to Product for soft delete

Revision ID: bb21befdd337
Revises: a49890441bae
Create Date: 2025-04-16 19:20:05.840603

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bb21befdd337'
down_revision: Union[str, None] = 'a49890441bae'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - adjusted ###
    op.add_column('products', sa.Column(
            'is_active',
            sa.Boolean(),
            nullable=False,
            # Añadir server_default='true' para que las filas existentes
            # y las nuevas inserciones a nivel DB tengan un default
            server_default=sa.text('true')
        )
    )
    op.create_index(op.f('ix_products_is_active'), 'products', ['is_active'], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_products_is_active'), table_name='products')
    op.drop_column('products', 'is_active')
    # ### end Alembic commands ###

