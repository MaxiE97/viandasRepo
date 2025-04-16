# viandas/backend/schemas/schemas.py
# (COMPLETO Y CORREGIDO para Soft Delete)

from pydantic import BaseModel, EmailStr, Field
from datetime import date
from typing import Optional, List

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
    precioActual: float = Field(..., gt=0)
    detalle: Optional[str] = None
    mostrarEnSistema: Optional[bool] = True
    stock: int = Field(..., ge=0)
    stockMinimo: int = Field(..., ge=0)
    foto: Optional[str] = None
    # is_active es manejado por el modelo al crear,
    # pero lo incluimos aquí para claridad y para ProductUpdate
    is_active: Optional[bool] = True # Este es el is_active del producto

class ProductCreate(ProductBase):
    # No necesita is_active aquí, usará el default del modelo
    pass

class ProductUpdate(BaseModel):
    # Esquema específico para actualizar, todos los campos son opcionales
    nombre: Optional[str] = None
    precioActual: Optional[float] = Field(None, gt=0)
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

    class Config:
        from_attributes = True # Habilitar modo ORM

# --------------------
# LineOfSale Schemas
# --------------------
class LineOfSaleBase(BaseModel):
    cantidad: int = Field(..., gt=0)

class LineOfSaleCreate(LineOfSaleBase):
    product_id: int

class LineOfSale(LineOfSaleBase):
    id: int
    numeroDeLinea: Optional[int] = None
    precio: Optional[float] = None

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
    precio: float
    # Product aquí devolverá el producto completo, incluyendo su estado is_active
    # lo cual está bien para mostrar ventas pasadas.
    product: Product # Usa el schema Product definido arriba

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
    line_of_sales: List[LineOfSaleFull] # Usa LineOfSaleFull

    class Config:
        from_attributes = True