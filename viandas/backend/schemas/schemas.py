#shemas.py

from pydantic import BaseModel, EmailStr, Field
from datetime import date
from typing import Optional, List

# --------------------
# User Schemas

# --------------------
class UserBase(BaseModel):
    email: EmailStr
    name: str
    apellido: str  # Nuevo campo
    celular: str



class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    role: str  # <-- Agregamos el rol aquí

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
    pagado: Optional[bool] = False

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
  #  numeroDeLinea: int

class LineOfSaleCreate(LineOfSaleBase):
    product_id: int

class LineOfSale(LineOfSaleBase):
    id: int

    class Config:
        orm_mode = True



# --------------------
# Sale with LineOfSale
# --------------------

class SaleWithLines(BaseModel):
    observation: Optional[str] = None
    lineas: List[LineOfSaleCreate] = Field(..., alias="line_of_sales")

    class Config:
        from_attributes = True  # Para Pydantic v2
        allow_population_by_field_name = True


class LineOfSaleFull(BaseModel):
    id: int
    cantidad: int
    numeroDeLinea: int
    precio: float
    product: Product  # Relación al producto

    class Config:
        orm_mode = True


class SaleAdminView(BaseModel):
    id: int
    quantity_product: int
    observation: Optional[str]
    date: date
    order_confirmed: bool
    sale_in_register: bool
    medioPago: Optional[str]
    pagado: bool
    user: User  # Relación con el usuario
    line_of_sales: List[LineOfSaleFull]  # Lista de líneas con productos

    class Config:
        orm_mode = True