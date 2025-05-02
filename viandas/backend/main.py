# main.py
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles # ¡Importar!
from fastapi.middleware.cors import CORSMiddleware
from config import engine
from models.models import Base, User # Importar Base en lugar de modelos específicos si usas metadata
from routes import auth, users, sales, products, admin, lines
import os # ¡Importar os!
from pathlib import Path 
from sqlalchemy.orm import Session

from config import engine, SessionLocal, Base
from core.security import get_password_hash 



# --- Lógica de Creación de Usuarios Iniciales ---

def create_initial_users():
    db: Session = SessionLocal() # Crear una sesión de DB temporal
    try:
        # --- Usuario Administrador ---
        admin_email = "admin@user.com" # Puedes cambiar esto
        admin_password = "admincontraseña"  
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            hashed_password = get_password_hash(admin_password)
            new_admin = User(
                email=admin_email,
                name="Admin",
                apellido="-",
                hashed_password=hashed_password,
                role="admin", # Asignar rol de admin
                is_active=True
            )
            db.add(new_admin)
           

        # --- Usuario "Caja" ---
        caja_email = "caja@user.com" # Email único para identificarlo
        caja_password = "cajacontraseña" 
        caja_user = db.query(User).filter(User.email == caja_email).first()
        if not caja_user:
            hashed_password = get_password_hash(caja_password)
            # Nota: Este usuario es más bien un placeholder para registrar la venta.
            # Podrías darle un rol específico si quieres diferenciarlo más.
            new_caja = User(
                email=caja_email,
                name="Venta en caja",
                apellido="-",
                hashed_password=hashed_password, # Necesita un hash válido
                role="user", # O un rol "caja" si lo creas/necesitas
                is_active=True # Debe estar activo
            )
            db.add(new_caja)
            

        db.commit() # Guardar los cambios si se añadieron usuarios

    except Exception as e:
        print(f"Error al crear usuarios iniciales: {e}")
        db.rollback() # Revertir en caso de error
    finally:
        db.close() # Cerrar la sesión

# --- Fin Lógica Usuarios Iniciales --

# Crear las tablas si no existen (usando Base.metadata)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Tu API",
    description="API description",
    openapi_tags=[{"name": "auth", "description": "Authentication"}],
)


# --- Evento de Inicio ---
@app.on_event("startup")
async def on_startup():
    
    create_initial_users()
# --- Fin Evento de Inicio ---


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