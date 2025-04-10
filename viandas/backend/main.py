# main.py
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles # ¡Importar!
from fastapi.middleware.cors import CORSMiddleware
from config import engine
from models.models import Base # Importar Base en lugar de modelos específicos si usas metadata
from routes import auth, users, sales, products, admin, lines
import os # ¡Importar os!
from pathlib import Path # ¡Importar Path!

# Crear las tablas si no existen (usando Base.metadata)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Tu API",
    description="API description",
    openapi_tags=[{"name": "auth", "description": "Authentication"}],
)

# --- CONFIGURACIÓN ARCHIVOS ESTÁTICOS ---
# Define el directorio donde se guardarán las imágenes
STATIC_DIR = Path("static")
PRODUCT_IMAGE_DIR = STATIC_DIR / "product_images"

# Crear directorios si no existen
PRODUCT_IMAGE_DIR.mkdir(parents=True, exist_ok=True)

# Montar el directorio estático para que sea accesible desde la URL /static
# IMPORTANTE: Montar ANTES de incluir los routers si estos dependen de este path
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
# -----------------------------------------


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials = True,
    allow_methods=["*"],
    allow_headers = ["*"]
)


# Incluir los routers
tags_metadata = [
    {"name": "auth", "description": "Endpoints de autenticación"},
    {"name": "users", "description": "Gestión de usuarios"},
    {"name": "sales", "description": "Gestión de ventas"},
    {"name": "products", "description": "Gestión de productos"},
    {"name": "admin", "description": "Operaciones administrativas"},
    {"name": "lines", "description": "Gestión de lineas de venta"},
]

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(sales.router, prefix="/sales", tags=["sales"])
app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(lines.router, prefix="/lines", tags=["lines"])