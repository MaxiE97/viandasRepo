# viandas/backend/schemas/schemas.py
# (COMPLETO - Modificado para usar Decimal en precios)

from pydantic import BaseModel, EmailStr, Field
from datetime import date
from typing import Optional, List
from decimal import Decimal # ¡Importar Decimal!

# --------------------
# User Schemas
# --------------------
class UserBase(BaseModel):
    email: EmailStr
    name: str
    apellido: Optional[str] = None
    celular: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool # Este es el is_active del usuario
    role: str

    class Config:
        from_attributes = True

# --------------------
# Token Schemas
# --------------------
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --------------------
# Product Schemas
# --------------------
class ProductBase(BaseModel):
    nombre: str
    # --- CAMBIO: Usar Decimal ---
    precioActual: Decimal = Field(..., gt=0, decimal_places=2)
    # --- FIN CAMBIO ---
    detalle: Optional[str] = None
    mostrarEnSistema: Optional[bool] = True
    stock: int = Field(..., ge=0)
    stockMinimo: int = Field(..., ge=0)
    foto: Optional[str] = None
    is_active: Optional[bool] = True # Este es el is_active del producto

class ProductCreate(ProductBase):
    # No necesita is_active aquí, usará el default del modelo
    pass

class ProductUpdate(BaseModel):
    # Esquema específico para actualizar, todos los campos son opcionales
    nombre: Optional[str] = None
    # --- CAMBIO: Usar Decimal ---
    precioActual: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    # --- FIN CAMBIO ---
    detalle: Optional[str] = None
    mostrarEnSistema: Optional[bool] = None
    stock: Optional[int] = Field(None, ge=0)
    stockMinimo: Optional[int] = Field(None, ge=0)
    foto: Optional[str] = None
    is_active: Optional[bool] = None # Permitir actualizar is_active explícitamente

class Product(ProductBase):
    # Esquema para devolver un producto desde la API
    id: int
    is_active: bool # Asegurar que siempre se devuelva el estado
    # --- CAMBIO: Usar Decimal ---
    precioActual: Decimal
    # --- FIN CAMBIO ---

    class Config:
        from_attributes = True # Habilitar modo ORM

# --------------------
# LineOfSale Schemas
# --------------------
class LineOfSaleBase(BaseModel):
    cantidad: int = Field(..., gt=0)

class LineOfSaleCreate(LineOfSaleBase):
    product_id: int
    # El precio se toma del producto en el backend al crear la línea

class LineOfSale(LineOfSaleBase):
    id: int
    numeroDeLinea: Optional[int] = None
    # --- CAMBIO: Usar Decimal ---
    precio: Optional[Decimal] = None # El precio con el que se vendió
    # --- FIN CAMBIO ---

    class Config:
        from_attributes = True

# --------------------
# Sale with LineOfSale (Esquema para recibir datos en creación)
# --------------------
class SaleWithLines(BaseModel):
    observation: Optional[str] = None
    medioPago: Optional[str] = None
    line_of_sales: List[LineOfSaleCreate]

    class Config:
        from_attributes = True


# --- Schemas para VISTAS (Devolver datos) ---

# Línea de venta con info del producto para mostrarla
class LineOfSaleFull(BaseModel):
    id: int
    cantidad: int
    numeroDeLinea: Optional[int] = None
    # --- CAMBIO: Usar Decimal ---
    precio: Decimal # Precio al momento de la venta
    # --- FIN CAMBIO ---
    product: Product # Usa el schema Product definido arriba (que ya usa Decimal)

    class Config:
        from_attributes = True

# Vista completa de la venta para el admin o cliente
class SaleAdminView(BaseModel):
    id: int
    quantity_product: int
    observation: Optional[str]
    date: date
    order_confirmed: bool
    sale_in_register: bool
    medioPago: Optional[str]
    pagado: bool
    user: Optional[User] = None # Puede ser null para ventas de caja
    line_of_sales: List[LineOfSaleFull] # Usa LineOfSaleFull (que ya usa Decimal)

    class Config:
        from_attributes = True


# --- SCHEMAS PARA EL RESUMEN HISTÓRICO ---

class ProductPerformanceSummary(BaseModel):
    """Schema para el resumen de rendimiento de un solo producto."""
    product_name: str
    total_units_sold: int
    # --- CAMBIO: Usar Decimal ---
    # SQLAlchemy sumará Numeric, resultando en Decimal.
    total_revenue: Decimal
    # --- FIN CAMBIO ---

    class Config:
        from_attributes = True # Necesario si los datos vienen de un ORM con esos nombres

class HistoricalSummaryResponse(BaseModel):
    """Schema para la respuesta completa del resumen histórico."""
    products: List[ProductPerformanceSummary]
    # --- CAMBIO: Usar Decimal ---
    overall_total_revenue: Decimal
    # --- FIN CAMBIO ---