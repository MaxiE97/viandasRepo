#main.py
from fastapi import FastAPI
from config import engine
from models.models import User, Sale
from routes import auth, users, sales, products, admin

# Crear las tablas en la base de datos
User.metadata.create_all(bind=engine)
Sale.metadata.create_all(bind=engine)

app = FastAPI(
    title="Tu API",
    description="API description",
    openapi_tags=[{"name": "auth", "description": "Authentication"}],
)

# Incluir los routers
tags_metadata = [
    {"name": "auth", "description": "Endpoints de autenticación"},
    {"name": "users", "description": "Gestión de usuarios"},
    {"name": "sales", "description": "Gestión de ventas"},
    {"name": "products", "description": "Gestión de productos"},
    {"name": "admin", "description": "Operaciones administrativas"},
]

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(sales.router, prefix="/sales", tags=["sales"])
app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])