# routes/sales.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.models import Sale, User, LineOfSale, Product
from schemas.schemas import SaleCreate, SaleWithLines, LineOfSaleCreate
from api.deps import get_db, get_current_user
from datetime import date
from typing import List


router = APIRouter()



@router.post("/", response_model=SaleWithLines)
def create_sale(
    sales: SaleWithLines,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lines = sales.lineas

    # Crear la venta
    new_sale = Sale(
        quantity_product=len(lines),  # Cantidad total de productos en la venta
        observation=sales.observation,
        date=date.today(),
        order_confirmed=False,
        sale_in_register=False,
        user_id=current_user.id
    )

    db.add(new_sale)
    db.flush()  # Obtiene el ID antes de agregar las líneas de venta

    new_lines = []
    for line in lines:
        product = db.query(Product).filter(Product.id == line.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with id {line.product_id} not found")

        new_line = LineOfSale(
            cantidad=line.cantidad,
            numeroDeLinea=line.numeroDeLinea,
            precio=product.precioActual,
            sale_id=new_sale.id,
            product_id=line.product_id,
        )
        db.add(new_line)
        new_lines.append(new_line)  # Guardamos en una lista para devolverlo después

    db.commit()
    db.refresh(new_sale)

    # Agregar las líneas de venta a la respuesta
    new_sale.line_of_sales = new_lines

    return new_sale

