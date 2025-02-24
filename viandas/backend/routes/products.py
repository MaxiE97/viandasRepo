# routes/products.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from models.models import Product
from schemas.schemas import ProductCreate, Product as ProductSchema
from api.deps import get_db, get_current_user
from models.models import User

router = APIRouter()

@router.post("/", response_model=ProductSchema)
def create_product(
    product: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    new_product = Product(**product.dict())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product