# routes/lines.py
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from models.models import LineOfSale, Product
from schemas.schemas import LineOfSaleCreate, LineOfSale as LineSchema
from api.deps import get_db, get_current_user
from models.models import User

router = APIRouter()

@router.post("/", response_model=LineOfSaleCreate)
def create_line(
    line : LineOfSaleCreate,
    db: Session = Depends(get_db)
):
    
    product = db.query(Product).filter(Product.id == line.product_id).first()

    if not product:
     raise HTTPException(status_code=404, detail="Producto no encontrado")

    new_line = LineOfSale(
        cantidad = line.cantidad,
        numeroDeLinea = line.numeroDeLinea,
        precio = product.precioActual,
        sale_id = line.sale_id,
        product_id = line.product_id,
    )

    db.add(new_line)
    db.commit()
    db.refresh(new_line)
    return new_line
   
    
