from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from sqlalchemy.orm import Session
from typing import Annotated

from core.security import (
    verify_password,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_password_hash
)
from api.deps import get_db, get_current_user
from models.models import User, Sale
from schemas.schemas import UserCreate, SaleCreate, Token, User as UserSchema
from config import engine
from schemas.schemas import ProductCreate, Product as ProductSchema  # Importar el esquema Pydantic
from models.models import Product as ProductModel  # Importar el modelo SQLAlchemy

User.metadata.create_all(bind=engine)
Sale.metadata.create_all(bind=engine)

app = FastAPI(
    title="Tu API",
    description="API description",
    openapi_tags=[{"name": "auth", "description": "Authentication"}],
)

@app.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users/", response_model=UserSchema)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        name=user.name,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/admin/test/")
def get_admin_stats(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return "Excelente, eres administrador"

@app.post("/sales/", response_model=SaleCreate)
def create_sale(
    sale: SaleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_sale = Sale(
        quantity_product=sale.quantity_product,
        observation=sale.observation,
        date=sale.date,
        order_confirmed=sale.order_confirmed,
        sale_in_register=sale.sale_in_register,
        user_id=current_user.id
    )
    db.add(new_sale)
    db.commit()
    db.refresh(new_sale)
    return new_sale

@app.get("/my-sales/")
def read_my_sales(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sales = db.query(Sale).filter(Sale.user_id == current_user.id).all()
    return sales

@app.post("/products/", response_model=ProductSchema)  # Usar el esquema Pydantic para la respuesta
def create_product(
    product: ProductCreate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Crear un nuevo producto usando el modelo SQLAlchemy
    new_product = ProductModel(
        nombre=product.nombre,
        precioActual=product.precioActual,
        detalle=product.detalle,
        mostrarEnSistema=product.mostrarEnSistema,
        foto=product.foto,
        stock=product.stock,
        stockMinimo=product.stockMinimo
    )
    
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product  # Retornar el nuevo producto

@app.put("/products/{product_id}", response_model=ProductSchema)  # Usar el esquema Pydantic para la respuesta
def update_product(
    product_id: int, 
    product: ProductCreate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Buscar el producto en la base de datos usando el modelo SQLAlchemy
    db_product = db.query(ProductModel).filter(ProductModel.id == product_id).first()  # Cambiar a ProductModel
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Actualizar los atributos del producto
    for key, value in product.dict().items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product  