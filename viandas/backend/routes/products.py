# routes/products.py
from fastapi import (
    APIRouter, HTTPException, Depends, status, 
    File, UploadFile # ¡Añadir File y UploadFile!
)
from sqlalchemy.orm import Session
from models.models import Product, User
from schemas.schemas import ProductCreate, Product as ProductSchema, ProductBase
from api.deps import get_db, get_current_user
import shutil  # ¡Importar shutil!
import uuid    # ¡Importar uuid!
from pathlib import Path # ¡Importar Path!

router = APIRouter()

# --- Directorio base para imágenes de productos ---
IMAGE_DIR = Path("static/product_images")
# Asegurarse que existe (aunque ya lo hicimos en main.py)
IMAGE_DIR.mkdir(parents=True, exist_ok=True)

# --- ENDPOINT PARA SUBIR IMAGEN ---
@router.post("/upload-image/", status_code=status.HTTP_201_CREATED, tags=["products"])
async def upload_product_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Sube una imagen de producto. Requiere permisos de administrador.
    Devuelve el nombre del archivo guardado relativo al directorio de imágenes.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para subir imágenes"
        )

    # Validación básica del tipo MIME
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de archivo no permitido. Sube solo imágenes."
        )

     # Validación de tamaño (ejemplo: máximo 5MB)
    MAX_SIZE_MB = 5
    MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

    # Leer el tamaño del archivo de forma segura
    # Necesitamos leer el archivo para saber su tamaño real antes de guardarlo
    # Esto puede consumir memoria si los archivos son muy grandes.
    # Una alternativa es limitar por `content-length` header si confías en él.
    size = 0
    CHUNK_SIZE = 1024 * 1024 # Leer en chunks de 1MB
    while chunk := await file.read(CHUNK_SIZE):
         size += len(chunk)
         if size > MAX_SIZE_BYTES:
              await file.close() # Asegurar cerrar el archivo
              raise HTTPException(
                  status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                  detail=f"El archivo es demasiado grande. Máximo permitido: {MAX_SIZE_MB}MB"
              )
    # Importante: Rebobinar el archivo para poder guardarlo después de leerlo
    await file.seek(0)


    # Generar nombre de archivo único
    file_extension = Path(file.filename).suffix.lower() # Usar minúsculas para consistencia
    # Validar extensiones permitidas si quieres ser más estricto
    allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    if file_extension not in allowed_extensions:
         await file.close()
         raise HTTPException(
             status_code=status.HTTP_400_BAD_REQUEST,
             detail=f"Extensión de archivo no permitida. Permitidas: {', '.join(allowed_extensions)}"
         )

    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = IMAGE_DIR / unique_filename

    try:
        # Guardar el archivo en el servidor
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        # Manejo básico de errores al guardar
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"No se pudo guardar la imagen: {e}"
        )
    finally:
        # Asegúrate de cerrar el archivo de subida
        await file.close()

    # Devolver solo el nombre del archivo
    return {"filename": unique_filename}
# --- FIN ENDPOINT SUBIR IMAGEN ---


# --- Endpoints existentes (NO necesitan cambios en su lógica principal) ---

@router.get("/", response_model=list[ProductSchema], tags=["products"])
def list_products(db: Session = Depends(get_db)):
    """
    Obtiene una lista de todos los productos.
    """
    return db.query(Product).all()

@router.post("/", response_model=ProductSchema, status_code=status.HTTP_201_CREATED, tags=["products"])
def create_product(
    product: ProductCreate, # Ya incluye 'foto: Optional[str]'
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Crea un nuevo producto. Solo accesible para administradores.
    El campo 'foto' debe contener el nombre de archivo devuelto por /upload-image/.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para crear productos"
        )

    # El nombre de archivo ya viene en product.foto (o es None)
    new_product = Product(**product.dict()) 
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product


@router.put("/{product_id}", response_model=ProductSchema, tags=["products"])
def update_product(
    product_id: int,
    product_update: ProductCreate, # Ya incluye 'foto: Optional[str]'
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Actualiza un producto existente por su ID. Solo accesible para administradores.
    El campo 'foto' debe contener el nombre de archivo devuelto por /upload-image/.
    Si 'foto' no se incluye en el request (y usas exclude_unset=True o similar), no se actualizará.
    Si se envía 'foto' como null, se borrará la referencia en la BD (pero no el archivo).
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para actualizar productos"
        )

    db_product = db.query(Product).filter(Product.id == product_id).first()

    if db_product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con id {product_id} no encontrado"
        )

    # TODO Opcional: Si se actualiza 'foto', borrar el archivo antiguo del servidor
    # old_foto = db_product.foto
    # new_foto = product_update.dict(exclude_unset=True).get('foto', old_foto) # Necesita exclude_unset=False si quieres setear a null
    # if old_foto and new_foto != old_foto:
    #      old_file_path = IMAGE_DIR / old_foto
    #      if old_file_path.is_file():
    #          old_file_path.unlink() # Borrar archivo viejo

    # Actualizar usando todos los datos que lleguen (si usas exclude_unset=False en dict())
    # o solo los que lleguen (si usas exclude_unset=True)
    update_data = product_update.dict(exclude_unset=False) # O True si prefieres patch

    for key, value in update_data.items():
        if hasattr(db_product, key):
            setattr(db_product, key, value)

    db.commit()
    db.refresh(db_product)
    return db_product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["products"])
def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Elimina un producto existente por su ID. Solo accesible para administradores.
    NOTA: Esto NO elimina el archivo de imagen asociado del servidor.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para eliminar productos"
        )

    db_product = db.query(Product).filter(Product.id == product_id).first()

    if db_product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con id {product_id} no encontrado"
        )

    # --- Opcional: Borrar archivo de imagen antes de borrar el producto ---
    # if db_product.foto:
    #     file_path = IMAGE_DIR / db_product.foto
    #     if file_path.is_file():
    #         try:
    #             file_path.unlink()
    #         except OSError as e:
    #             print(f"Advertencia: No se pudo borrar el archivo {file_path}: {e}") # Loggear error
    # --- Fin Opcional ---


    db.delete(db_product)
    db.commit()

    # No se devuelve contenido con el status 204
    return None