"""Change price columns to Numeric(10, 2)

Revision ID: ac060caa4d6d
Revises: bb21befdd337
Create Date: 2025-05-02 19:37:39.758849 # Esta fecha está bien

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ac060caa4d6d'
down_revision: Union[str, None] = 'bb21befdd337' # Asegúrate que es la revisión anterior correcta
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### CORRECCIÓN MANUAL - USAR ALTER COLUMN ###

    # Modificar la columna 'precio' en la tabla 'lineOfSale'
    op.alter_column('lineOfSale', 'precio',  # Nombre correcto de la columna
               existing_type=sa.FLOAT(),     # Tipo que tenía antes (o sa.DOUBLE_PRECISION si es más exacto)
               type_=sa.Numeric(precision=10, scale=2), # Nuevo tipo Numeric
               existing_nullable=False)      # Mantener la restricción NOT NULL

    # Modificar la columna 'precioActual' en la tabla 'products'
    op.alter_column('products', 'precioActual',
               existing_type=sa.FLOAT(),      # Tipo que tenía antes (o sa.DOUBLE_PRECISION)
               type_=sa.Numeric(precision=10, scale=2), # Nuevo tipo Numeric
               existing_nullable=False)       # Mantener la restricción NOT NULL
    # ### FIN CORRECCIÓN ###


def downgrade() -> None:
    # ### CORRECCIÓN MANUAL - Revertir usando ALTER COLUMN ###

    # Revertir la columna 'precioActual' en 'products' a FLOAT
    op.alter_column('products', 'precioActual',
               existing_type=sa.Numeric(precision=10, scale=2), # Tipo actual (Numeric)
               type_=sa.FLOAT(),                              # Tipo al que se revierte (Float)
               existing_nullable=False)

    # Revertir la columna 'precio' en 'lineOfSale' a FLOAT
    op.alter_column('lineOfSale', 'precio',  # Nombre correcto de la columna
               existing_type=sa.Numeric(precision=10, scale=2), # Tipo actual (Numeric)
               type_=sa.FLOAT(),                              # Tipo al que se revierte (Float)
               existing_nullable=False)
    # ### FIN CORRECCIÓN ###