# app/models/models.py
from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, Float
from sqlalchemy.orm import relationship
from config import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)  # Nuevo campo
    is_active = Column(Boolean, default=True)  # Nuevo campo
    role = Column(String, default="user")
    # Relationship to Sales
    sales = relationship("Sale", back_populates="user")


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    quantity_product = Column(Integer)
    observation = Column(String, nullable=True)
    date = Column(Date)
    order_confirmed = Column(Boolean)
    sale_in_register = Column(Boolean)

    user_id = Column(Integer, ForeignKey("users.id"))

    # Relationship to User (Customer)
    user = relationship("User", back_populates="sales")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    precioActual = Column(Float, nullable=False)
    detalle = Column(String, nullable=True)
    mostrarEnSistema = Column(Boolean, default=True)
    foto = Column(String, nullable=True)  # Puedes almacenar la URL de la foto o la ruta del archivo
    stock = Column(Integer, nullable=False)
    stockMinimo = Column(Integer, nullable=False)