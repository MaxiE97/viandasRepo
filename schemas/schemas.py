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