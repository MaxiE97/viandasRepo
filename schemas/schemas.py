from pydantic import BaseModel, EmailStr
from datetime import date
from typing import Optional, List

# --------------------
# User Schemas
# --------------------
class UserBase(BaseModel):
    email: EmailStr
    name: str
    apellido: str  # Nuevo campo

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool

    class Config:
        orm_mode = True

# --------------------
# Token Schemas
# --------------------
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --------------------
# Sale Schemas
# --------------------
class SaleCreate(BaseModel):
    quantity_product: int
    observation: Optional[str] = None
    date: date
    order_confirmed: bool
    sale_in_register: bool
    medioPago: Optional[str] = None  # Nuevo campo

    class Config:
        orm_mode = True

# --------------------
# Product Schemas
# --------------------
class ProductBase(BaseModel):
    nombre: str
    precioActual: float
    detalle: Optional[str] = None
    mostrarEnSistema: Optional[bool] = True
    stock: int
    stockMinimo: int
    foto: Optional[str] = None  # Campo foto

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int

    class Config:
        orm_mode = True

# --------------------
# LineOfSale Schemas
# --------------------
class LineOfSaleBase(BaseModel):
    cantidad: int
    numeroDeLinea: int
    precio: float

class LineOfSaleCreate(LineOfSaleBase):
    sale_id: int
    product_id: int

class LineOfSale(LineOfSaleBase):
    id: int

    class Config:
        orm_mode = True
