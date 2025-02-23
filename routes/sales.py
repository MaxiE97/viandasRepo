# routes/sales.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models.models import Sale, User
from schemas.schemas import SaleCreate
from api.deps import get_db, get_current_user

router = APIRouter()

@router.post("/", response_model=SaleCreate)
def create_sale(
    sale: SaleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_sale = Sale(
        quantity_product=sale.quantity_product,
        observation=sale.observation,
        date=sale.date,
        order_confirmed=sale.order_confirmed,
        sale_in_register=sale.sale_in_register,
        user_id=current_user.id
    )
    db.add(new_sale)
    db.commit()
    db.refresh(new_sale)
    return new_sale