from pydantic import BaseModel, EmailStr
from datetime import date
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class SaleCreate(BaseModel):
    quantity_product: int
    observation: Optional[str] = None
    date: date
    order_confirmed: bool
    sale_in_register: bool

    class Config:
        orm_mode = True


class ProductBase(BaseModel):
    nombre: str
    precioActual: float
    detalle: Optional[str] = None
    mostrarEnSistema: Optional[bool] = True
    stock: int
    stockMinimo: int
    foto: Optional[str] = None  # Agregar el campo foto

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int

    class Config:
        orm_mode = True