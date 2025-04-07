# routes/products.py
from fastapi import APIRouter, HTTPException, Depends, status # Importa status para los códigos HTTP
from sqlalchemy.orm import Session
from models.models import Product, User # Asegúrate de importar User
from schemas.schemas import ProductCreate, Product as ProductSchema, ProductBase # Importa ProductBase también si es necesario
from api.deps import get_db, get_current_user

router = APIRouter()

# --- Endpoints existentes ---

@router.get("/", response_model=list[ProductSchema])
def list_products(db: Session = Depends(get_db)):
    """
    Obtiene una lista de todos los productos.
    """
    return db.query(Product).all()

@router.post("/", response_model=ProductSchema, status_code=status.HTTP_201_CREATED) # Añadir status_code 201
def create_product(
    product: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Crea un nuevo producto. Solo accesible para administradores.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="No tienes permiso para crear productos"
        )
    # Puedes añadir una validación aquí si quieres para ver si ya existe un producto con el mismo nombre
    # db_product_exists = db.query(Product).filter(Product.nombre == product.nombre).first()
    # if db_product_exists:
    #     raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Ya existe un producto con el nombre '{product.nombre}'")
        
    new_product = Product(**product.dict())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

# --- INICIO NUEVOS ENDPOINTS ---

@router.put("/{product_id}", response_model=ProductSchema)
def update_product(
    product_id: int,
    product_update: ProductCreate, # Recibe los datos a actualizar. Asume actualización completa.
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Actualiza un producto existente por su ID. Solo accesible para administradores.
    Requiere enviar todos los campos del producto (actualización completa).
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

    # Actualizar los campos del producto encontrado con los datos recibidos
    # product_update.dict() convierte el schema Pydantic a un diccionario
    update_data = product_update.dict(exclude_unset=False) # exclude_unset=False para asegurar que todos los campos se intentan actualizar
    
    for key, value in update_data.items():
         # Verifica si el producto de la BD tiene ese atributo antes de asignarlo
         if hasattr(db_product, key):
              setattr(db_product, key, value)
         # else: # Opcional: Podrías loggear o ignorar campos extras enviados por el cliente
              # print(f"Advertencia: El campo '{key}' no existe en el modelo Product y será ignorado.")

    db.commit()
    db.refresh(db_product) # Refrescar para obtener los datos actualizados desde la BD
    return db_product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Elimina un producto existente por su ID. Solo accesible para administradores.
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

    db.delete(db_product)
    db.commit()

    # No se devuelve contenido con el status 204
    return None 

# --- FIN NUEVOS ENDPOINTS ---