# routes/sales.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.models import Sale, User, LineOfSale, Product
from schemas.schemas import SaleCreate, SaleWithLines, LineOfSaleCreate
from api.deps import get_db, get_current_user
from datetime import date
from typing import List


router = APIRouter()


@router.post("/online", response_model=SaleWithLines)
def create_sale(
    sales: SaleWithLines,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lines = sales.lineas

    # Calcular la cantidad total sumando la cantidad de cada línea
    total_quantity = sum(line.cantidad for line in lines)

    # Crear la venta usando la cantidad total calculada
    new_sale = Sale(
        quantity_product=total_quantity,  # Se asigna la suma total
        observation=sales.observation,
        date=date.today(),
        order_confirmed=False,
        sale_in_register=False,
        user_id=current_user.id
    )

    db.add(new_sale)
    db.flush()  # Se obtiene el ID de la venta antes de agregar las líneas

    new_lines = []
    # Usar enumerate para asignar automáticamente el número de línea
    for index, line in enumerate(lines):
        product = db.query(Product).filter(Product.id == line.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with id {line.product_id} not found")

        new_line = LineOfSale(
            cantidad=line.cantidad,
            numeroDeLinea=index + 1,  # Se asigna automáticamente el número de línea
            precio=product.precioActual,
            sale_id=new_sale.id,
            product_id=line.product_id,
        )
        db.add(new_line)
        new_lines.append(new_line)  # Se agregan las líneas para devolver en la respuesta

    db.commit()
    db.refresh(new_sale)

    # Agregar las líneas de venta a la respuesta
    new_sale.line_of_sales = new_lines

    return new_sale
