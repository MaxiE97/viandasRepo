# routes/sales.py
from fastapi import APIRouter, Depends, HTTPException, Body, status 
from sqlalchemy.orm import Session
from models.models import Sale, User, LineOfSale, Product
from schemas.schemas import SaleCreate, SaleWithLines, LineOfSaleCreate, SaleAdminView
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
        pagado=False,
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


# GET todas las ventas (ADMIN)
@router.get("/all", response_model=List[SaleAdminView])
def get_all_sales_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")

    sales = db.query(Sale).all()
    return sales


# GET venta por ID (ADMIN)
@router.get("/admin/{sale_id}", response_model=SaleAdminView)
def get_sale_by_id_admin(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")

    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    
    return sale


# PUT para confirmar venta (ADMIN)
@router.put("/{sale_id}/confirm", response_model=SaleAdminView)
def confirm_sale_admin(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")

    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    sale.order_confirmed = True
    db.commit()
    db.refresh(sale)

    return sale

# GET - Pedidos solicitados (no confirmados, no registrados)
@router.get("/pedidos-solicitados", response_model=List[SaleAdminView])
def get_pedidos_solicitados(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")

    sales = db.query(Sale).filter(
        Sale.order_confirmed == False,
        Sale.sale_in_register == False
    ).all()
    return sales


# GET - Pedidos pendientes de retiro (confirmados, no registrados)
@router.get("/pendientes-retiro", response_model=List[SaleAdminView])
def get_pedidos_pendientes_retiro(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")

    sales = db.query(Sale).filter(
        Sale.order_confirmed == True,
        Sale.sale_in_register == False
    ).all()
    return sales


# GET - Ventas (registradas o confirmadas)
@router.get("/ventas", response_model=List[SaleAdminView])
def get_ventas_finalizadas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")

    sales = db.query(Sale).filter(
        (Sale.order_confirmed == True) | (Sale.sale_in_register == True)
    ).all()
    return sales


# PUT - Marcar como pagado
@router.put("/{sale_id}/pagado", response_model=SaleAdminView)
def set_pagado(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")

    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    sale.pagado = True
    db.commit()
    db.refresh(sale)
    return sale


@router.post("/ventas/caja", response_model=SaleAdminView)
def crear_venta_en_caja(
    venta: SaleWithLines = Body(...),
    db: Session = Depends(get_db),
):
    # Usuario fijo para ventas en caja
    usuario_caja_id = 5

    # Calcular cantidad total
    total_quantity = sum(line.cantidad for line in venta.lineas)

    nueva_venta = Sale(
        quantity_product=total_quantity,
        observation=venta.observation,
        date=date.today(),
        order_confirmed=True,
        sale_in_register=True,
        pagado=True,  # En caja se asume pagado
        medioPago="Caja",  # Valor por defecto, si querés puede ser custom
        user_id=usuario_caja_id
    )

    db.add(nueva_venta)
    db.flush()

    nuevas_lineas = []
    for index, linea in enumerate(venta.lineas):
        producto = db.query(Product).filter(Product.id == linea.product_id).first()
        if not producto:
            raise HTTPException(status_code=404, detail=f"Producto con id {linea.product_id} no encontrado")

        linea_venta = LineOfSale(
            cantidad=linea.cantidad,
            numeroDeLinea=index + 1,
            precio=producto.precioActual,
            sale_id=nueva_venta.id,
            product_id=linea.product_id,
        )
        db.add(linea_venta)
        nuevas_lineas.append(linea_venta)

    db.commit()
    db.refresh(nueva_venta)
    nueva_venta.line_of_sales = nuevas_lineas

    return nueva_venta

@router.put("/{sale_id}/register", response_model=SaleAdminView)
def register_sale_in_caja_admin(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Marca una venta existente como registrada en caja (sale_in_register = True).
    Solo accesible para administradores.
    """
    # 1. Verificar permisos de administrador
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="No autorizado para registrar ventas en caja"
        )

    # 2. Buscar la venta por ID
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Venta con id {sale_id} no encontrada"
        )

    # 3. Opcional: Verificar si ya está registrada para evitar trabajo innecesario
    # if sale.sale_in_register:
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST,
    #         detail=f"La venta {sale_id} ya está registrada en caja."
    #     )
        
    # 4. Opcional: Verificar si está confirmada antes de registrarla
    # if not sale.order_confirmed:
    #      raise HTTPException(
    #          status_code=status.HTTP_400_BAD_REQUEST,
    #          detail=f"La venta {sale_id} debe estar confirmada antes de registrarse en caja."
    #      )

    # 5. Actualizar el estado
    sale.sale_in_register = True
    
    # 6. Guardar los cambios en la base de datos
    db.commit()
    
    # 7. Refrescar el objeto para obtener el estado actualizado desde la BD
    db.refresh(sale)

    # 8. Devolver la venta actualizada
    return sale