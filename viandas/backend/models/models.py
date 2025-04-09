#models/models.py
from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, Float
from sqlalchemy.orm import relationship
from config import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    apellido = Column(String, index=True)  # Nuevo campo
    email = Column(String, unique=True, index=True)
    celular = Column(String, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
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
    medioPago = Column(String, nullable=True)  # Ahora puede ser null
    pagado = Column(Boolean, default=False)

    user_id = Column(Integer, ForeignKey("users.id"))

    # Relationship to User (Customer)
    user = relationship("User", back_populates="sales")
    
    # Relationship to LineOfSale
    line_of_sales = relationship("LineOfSale", back_populates="sale")

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
    
    # Relationship to LineOfSale
    line_of_sales = relationship("LineOfSale", back_populates="product")

class LineOfSale(Base):
    __tablename__ = "lineOfSale"

    id = Column(Integer, primary_key=True, index=True)
    cantidad = Column(Integer, nullable=False)
    numeroDeLinea = Column(Integer, nullable=False)
    precio = Column(Float, nullable=False)
    
    sale_id = Column(Integer, ForeignKey("sales.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    
    # Relationships
    sale = relationship("Sale", back_populates="line_of_sales")
    product = relationship("Product", back_populates="line_of_sales")
