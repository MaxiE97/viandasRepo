# viandas/backend/routes/products.py
# (COMPLETO Y CORREGIDO para Soft Delete)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
# Ajusta los imports según tu estructura de proyecto
from models import models
from schemas import schemas
from api.deps import get_db, get_current_user
from typing import List

router = APIRouter()

# --- Helper para obtener el usuario admin (opcional pero recomendado) ---
def require_admin(current_user: models.User = Depends(get_current_user)):
    """Dependency to ensure the user is an admin."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Requiere permisos de administrador",
        )
    return current_user

# --- CRUD de Productos ---

@router.post("/", response_model=schemas.Product, status_code=status.HTTP_201_CREATED)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_admin) # Requiere admin
):
    """
    Creates a new product. Only accessible by admins.
    Checks if a product with the same name already exists (active or inactive).
    """
    # Verificar si ya existe un producto con ese nombre (incluyendo inactivos)
    existing_product = db.query(models.Product).filter(models.Product.nombre == product.nombre).first()
    if existing_product:
        detail_msg = f"Ya existe un producto con el nombre '{product.nombre}'."
        if not existing_product.is_active:
            detail_msg += " (Está inactivo, considere reactivarlo o usar otro nombre)."
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail_msg
        )

    # Crear nuevo producto (is_active será True por defecto del modelo)
    # model_dump() es el reemplazo de dict() en Pydantic v2
    db_product = models.Product(**product.model_dump())
    try:
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
    except Exception as e: # Captura errores generales de DB
        db.rollback()
        print(f"Error creating product: {e}") # Log error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al crear el producto."
        )
    return db_product


@router.get("/", response_model=List[schemas.Product])
def read_products(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
    # current_user: models.User = Depends(get_current_user) # Descomentar si requiere login
):
    """
    Gets a list of ACTIVE products.
    Accessible by anyone (or logged-in users if dependency uncommented).
    """
    try:
        products = db.query(models.Product)\
                     .filter(models.Product.is_active == True)\
                     .order_by(models.Product.nombre)\
                     .offset(skip)\
                     .limit(limit)\
                     .all()
    except Exception as e:
        print(f"Error reading products: {e}") # Log error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al obtener los productos."
        )
    return products


@router.get("/{product_id}", response_model=schemas.Product)
def read_product(
    product_id: int,
    db: Session = Depends(get_db)
    # current_user: models.User = Depends(get_current_user) # Descomentar si requiere login
):
    """
    Gets a specific product by ID, only if it's ACTIVE.
    Accessible by anyone (or logged-in users if dependency uncommented).
    """
    try:
        db_product = db.query(models.Product)\
                       .filter(models.Product.id == product_id)\
                       .filter(models.Product.is_active == True)\
                       .first()
    except Exception as e:
        print(f"Error reading product {product_id}: {e}") # Log error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al obtener el producto."
        )

    if db_product is None:
        # Devuelve 404 si no existe O si no está activo
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    return db_product


@router.put("/{product_id}", response_model=schemas.Product)
def update_product(
    product_id: int,
    product_update: schemas.ProductUpdate, # Usar el schema específico de Update
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_admin) # Requiere admin
):
    """
    Updates an existing product. Only accessible by admins.
    Allows updating any field, including is_active.
    """
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if db_product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado para actualizar")

    # Verificar si se intenta cambiar el nombre a uno que ya existe (y no es el producto actual)
    if product_update.nombre and product_update.nombre != db_product.nombre:
         existing_product = db.query(models.Product).filter(
                models.Product.nombre == product_update.nombre,
                models.Product.id != product_id # Excluir el producto actual
            ).first()
         if existing_product:
              raise HTTPException(
                 status_code=status.HTTP_409_CONFLICT,
                 detail=f"Ya existe otro producto con el nombre '{product_update.nombre}'."
              )

    # Actualizar los campos proporcionados en product_update
    # model_dump(exclude_unset=True) solo incluye los campos enviados en el request
    update_data = product_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)

    try:
        db.commit()
        db.refresh(db_product)
    except Exception as e: # Captura errores generales de DB
        db.rollback()
        print(f"Error updating product {product_id}: {e}") # Log error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno al actualizar el producto."
        )
    return db_product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_admin) # Requiere admin
):
    """
    Performs a soft delete on a product by setting is_active=False.
    Only accessible by admins. Returns 204 No Content on success.
    """
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()

    if db_product is None:
        # Si no existe, devolver 404 igual
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado para eliminar")

    # --- Lógica de Soft Delete ---
    if db_product.is_active:
        db_product.is_active = False
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Error soft deleting product {product_id}: {e}") # Log error
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error interno al eliminar lógicamente el producto."
            )
    else:
        # Si ya estaba inactivo, no hacer nada y devolver éxito (204)
        # Opcionalmente podrías devolver un 304 Not Modified, pero 204 es simple.
        pass

    # Devolver 204 No Content indica éxito sin cuerpo de respuesta
    return None # Necesario para que FastAPI devuelva 204 correctamente