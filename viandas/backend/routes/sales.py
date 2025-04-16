# viandas/backend/routes/sales.py
# (COMPLETO Y CORREGIDO con validación is_active)

from fastapi import APIRouter, Depends, HTTPException, Body, status
from sqlalchemy.orm import Session, joinedload, selectinload
# Asegúrate que los imports sean correctos para tu estructura
from models.models import Sale, User, LineOfSale, Product
from schemas.schemas import SaleWithLines, LineOfSaleCreate, SaleAdminView, User as UserSchema # Renombrar UserSchema si choca
from api.deps import get_db, get_current_user
from datetime import date, datetime
from typing import List
import pytz # Para zona horaria
from sqlalchemy.exc import SQLAlchemyError # Para manejo de errores DB

router = APIRouter()

# Definir la zona horaria de Argentina
argentina_tz = pytz.timezone('America/Argentina/Buenos_Aires')

# --- Helper para obtener fecha actual en Argentina ---
def get_current_argentina_date():
    return datetime.now(argentina_tz).date() # Usar .date() para obtener solo la fecha

# --- Helper para requerir admin ---
def require_admin(current_user: UserSchema = Depends(get_current_user)):
    """Dependency to ensure the user is an admin."""
    if not hasattr(current_user, 'role') or current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Requiere permisos de administrador",
        )
    return current_user

@router.post("/online", response_model=SaleAdminView)
def create_sale(
    sales_data: SaleWithLines,
    current_user: User = Depends(get_current_user), # Usar Modelo User
    db: Session = Depends(get_db)
):
    """
    Crea un nuevo pedido online para el usuario logueado.
    Valida medio de pago y que los productos estén activos.
    """
    lines_data = sales_data.line_of_sales
    if not lines_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El pedido debe contener al menos un producto.")

    if sales_data.medioPago and sales_data.medioPago not in ["Efectivo", "Transferencia"]:
         raise HTTPException(
             status_code=status.HTTP_400_BAD_REQUEST,
             detail="Medio de pago inválido. Debe ser 'Efectivo' o 'Transferencia'."
         )

    total_quantity = sum(line.cantidad for line in lines_data)
    current_date = get_current_argentina_date()

    new_sale = Sale(
        quantity_product=total_quantity,
        observation=sales_data.observation,
        date=current_date,
        order_confirmed=False,
        sale_in_register=False,
        pagado=False,
        medioPago=sales_data.medioPago,
        user_id=current_user.id
    )

    db.add(new_sale)

    try:
        db.flush() # Obtener el ID de new_sale ANTES del bucle

        for index, line_data in enumerate(lines_data):
            # Bloquear producto para evitar race conditions
            product = db.query(Product).filter(Product.id == line_data.product_id).with_for_update().first()

            if not product:
                # No es necesario rollback aquí, fallará el commit general
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto con id {line_data.product_id} no encontrado.")

            # --- VALIDACIÓN SOFT DELETE ---
            if not product.is_active:
                 raise HTTPException(
                     status_code=status.HTTP_400_BAD_REQUEST,
                     detail=f"El producto '{product.nombre}' ya no está disponible."
                 )
            # ----------------------------

            # Verificar stock ANTES de crear la línea
            if product.stock < line_data.cantidad:
                 raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Stock insuficiente para '{product.nombre}'. Stock actual: {product.stock}, Solicitado: {line_data.cantidad}"
                )

            # No descontar stock para pedidos online aquí

            new_line = LineOfSale(
                cantidad=line_data.cantidad,
                numeroDeLinea=index + 1,
                precio=product.precioActual,
                sale_id=new_sale.id, # Usar ID obtenido del flush
                product_id=line_data.product_id,
            )
            db.add(new_line)
            # No es necesario el append a new_lines_objects si no se usa

        db.commit() # Confirmar todos los cambios (venta, líneas)

    except HTTPException as http_exc:
         db.rollback() # Revertir si hubo un error HTTP esperado
         raise http_exc
    except SQLAlchemyError as e:
        db.rollback()
        print(f"Error de base de datos al crear venta online: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno al procesar el pedido.")
    except Exception as e:
        db.rollback()
        print(f"Error inesperado al crear venta online: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error inesperado al crear el pedido.")

    # Cargar relaciones para la respuesta completa de forma eficiente
    sale_for_response = db.query(Sale).options(
        selectinload(Sale.user),
        selectinload(Sale.line_of_sales).selectinload(LineOfSale.product) # Carga producto activo o inactivo
    ).filter(Sale.id == new_sale.id).one_or_none() # one_or_none es más seguro

    if not sale_for_response:
         # Si no se encuentra después del commit, algo raro pasó
         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al recuperar la venta creada.")

    return sale_for_response


# --- Rutas de Admin ---

@router.get("/all", response_model=List[SaleAdminView])
def get_all_sales_admin(
    db: Session = Depends(get_db),
    admin_user: UserSchema = Depends(require_admin) # Requiere admin
):
    """Obtiene todas las ventas (admin)."""
    try:
        sales = db.query(Sale).options(
            selectinload(Sale.user),
            selectinload(Sale.line_of_sales).selectinload(LineOfSale.product) # Carga producto activo o inactivo
        ).order_by(Sale.id.desc()).all()
    except Exception as e:
        print(f"Error reading all sales: {e}")
        raise HTTPException(status_code=500, detail="Error interno al obtener las ventas.")
    return sales

@router.get("/admin/{sale_id}", response_model=SaleAdminView)
def get_sale_by_id_admin(
    sale_id: int,
    db: Session = Depends(get_db),
    admin_user: UserSchema = Depends(require_admin) # Requiere admin
):
    """Obtiene una venta específica por ID (admin)."""
    sale = db.query(Sale).options(
        selectinload(Sale.user),
        selectinload(Sale.line_of_sales).selectinload(LineOfSale.product) # Carga producto activo o inactivo
    ).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return sale

@router.put("/{sale_id}/confirm", response_model=SaleAdminView)
def confirm_sale_admin(
    sale_id: int,
    db: Session = Depends(get_db),
    admin_user: UserSchema = Depends(require_admin) # Requiere admin
):
    """Confirma un pedido online (admin)."""
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    if sale.order_confirmed:
         return sale # Ya está confirmada, operación idempotente

    sale.order_confirmed = True
    try:
        db.commit()
        db.refresh(sale) # Refrescar para obtener estado actualizado
    except Exception as e:
        db.rollback()
        print(f"Error confirming sale {sale_id}: {e}")
        raise HTTPException(status_code=500, detail="Error interno al confirmar la venta.")

    # Recargar con relaciones para la respuesta completa
    sale_for_response = db.query(Sale).options(
        selectinload(Sale.user),
        selectinload(Sale.line_of_sales).selectinload(LineOfSale.product)
    ).filter(Sale.id == sale.id).one_or_none() # Usar one_or_none

    if not sale_for_response:
         raise HTTPException(status_code=500, detail="Error al recuperar la venta confirmada.")

    return sale_for_response

@router.get("/pedidos-solicitados", response_model=List[SaleAdminView])
def get_pedidos_solicitados(
    db: Session = Depends(get_db),
    admin_user: UserSchema = Depends(require_admin) # Requiere admin
):
    """Obtiene pedidos online no confirmados ni registrados (admin)."""
    try:
        sales = db.query(Sale).options(
            selectinload(Sale.user),
            selectinload(Sale.line_of_sales).selectinload(LineOfSale.product)
        ).filter(
            Sale.order_confirmed == False,
            Sale.sale_in_register == False
        ).order_by(Sale.date.asc(), Sale.id.asc()).all()
    except Exception as e:
        print(f"Error fetching pedidos solicitados: {e}")
        raise HTTPException(status_code=500, detail="Error interno al obtener los pedidos solicitados.")
    return sales

@router.get("/pendientes-retiro", response_model=List[SaleAdminView])
def get_pedidos_pendientes_retiro(
    db: Session = Depends(get_db),
    admin_user: UserSchema = Depends(require_admin) # Requiere admin
):
    """Obtiene pedidos online confirmados pero no registrados (admin)."""
    try:
        sales = db.query(Sale).options(
            selectinload(Sale.user),
            selectinload(Sale.line_of_sales).selectinload(LineOfSale.product)
        ).filter(
            Sale.order_confirmed == True,
            Sale.sale_in_register == False
        ).order_by(Sale.date.asc(), Sale.id.asc()).all()
    except Exception as e:
        print(f"Error fetching pendientes retiro: {e}")
        raise HTTPException(status_code=500, detail="Error interno al obtener los pedidos pendientes.")
    return sales

@router.get("/ventas", response_model=List[SaleAdminView])
def get_ventas_finalizadas(
    db: Session = Depends(get_db),
    admin_user: UserSchema = Depends(require_admin) # Requiere admin
):
    """Obtiene ventas ya registradas en caja (admin)."""
    try:
        sales = db.query(Sale).options(
            selectinload(Sale.user),
            selectinload(Sale.line_of_sales).selectinload(LineOfSale.product)
        ).filter(
            Sale.sale_in_register == True
        ).order_by(Sale.date.desc(), Sale.id.desc()).all()
    except Exception as e:
        print(f"Error fetching ventas finalizadas: {e}")
        raise HTTPException(status_code=500, detail="Error interno al obtener las ventas finalizadas.")
    return sales

@router.put("/{sale_id}/pagado", response_model=SaleAdminView)
def set_pagado(
    sale_id: int,
    db: Session = Depends(get_db),
    admin_user: UserSchema = Depends(require_admin) # Requiere admin
):
    """Marca una venta como pagada (admin)."""
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    if sale.pagado:
         return sale # Ya está pagada, idempotente

    sale.pagado = True
    try:
        db.commit()
        db.refresh(sale)
    except Exception as e:
        db.rollback()
        print(f"Error setting sale {sale_id} as paid: {e}")
        raise HTTPException(status_code=500, detail="Error interno al marcar como pagado.")

    # Recargar con relaciones para la respuesta completa
    sale_for_response = db.query(Sale).options(
        selectinload(Sale.user),
        selectinload(Sale.line_of_sales).selectinload(LineOfSale.product)
    ).filter(Sale.id == sale.id).one_or_none()

    if not sale_for_response:
         raise HTTPException(status_code=500, detail="Error al recuperar la venta marcada como pagada.")

    return sale_for_response


@router.post("/ventas/caja", response_model=SaleAdminView)
def crear_venta_en_caja(
    venta_data: SaleWithLines,
    db: Session = Depends(get_db),
    admin_user: UserSchema = Depends(require_admin) # Requiere admin
):
    """
    Crea una venta directa en caja. Descuenta stock. Valida producto activo. (Admin)
    """
    usuario_caja_id = 5 # Considera buscarlo dinámicamente
    db_user_caja = db.query(User).filter(User.id == usuario_caja_id).first()
    if not db_user_caja:
         raise HTTPException(
             status_code=status.HTTP_404_NOT_FOUND,
             detail=f"Usuario de caja con ID {usuario_caja_id} no encontrado."
         )

    if not venta_data.medioPago or venta_data.medioPago not in ["Efectivo", "Transferencia"]:
         raise HTTPException(
             status_code=status.HTTP_400_BAD_REQUEST,
             detail="Se requiere un medio de pago válido ('Efectivo' o 'Transferencia') para la venta en caja."
         )

    lines_data = venta_data.line_of_sales
    if not lines_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La venta debe contener al menos un producto.")

    total_quantity = sum(line.cantidad for line in lines_data)
    current_date = get_current_argentina_date()

    nueva_venta = Sale(
        quantity_product=total_quantity,
        observation=venta_data.observation,
        date=current_date,
        order_confirmed=True,
        sale_in_register=True,
        pagado=True,
        medioPago=venta_data.medioPago,
        user_id=usuario_caja_id
    )

    db.add(nueva_venta)

    try:
        db.flush() # Obtener ID de la venta

        for index, linea_data in enumerate(lines_data):
            # Bloquear producto
            producto = db.query(Product).filter(Product.id == linea_data.product_id).with_for_update().first()

            if not producto:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto con id {linea_data.product_id} no encontrado.")

            # --- VALIDACIÓN SOFT DELETE ---
            if not producto.is_active:
                 raise HTTPException(
                     status_code=status.HTTP_400_BAD_REQUEST,
                     detail=f"El producto '{producto.nombre}' ya no está disponible para la venta."
                 )
            # ----------------------------

            if producto.stock < linea_data.cantidad:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Stock insuficiente para '{producto.nombre}'. Stock actual: {producto.stock}, Solicitado: {linea_data.cantidad}"
                )

            # Descontar stock al registrar venta en caja
            producto.stock -= linea_data.cantidad

            linea_venta = LineOfSale(
                cantidad=linea_data.cantidad,
                numeroDeLinea=index + 1,
                precio=producto.precioActual,
                sale_id=nueva_venta.id,
                product_id=linea_data.product_id,
            )
            db.add(linea_venta)

        db.commit() # Guardar venta, líneas y actualización de stock

    except HTTPException as http_exc:
        db.rollback()
        raise http_exc
    except SQLAlchemyError as e:
        db.rollback()
        print(f"Error de base de datos al crear venta en caja: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno al procesar la venta.")
    except Exception as e:
        db.rollback()
        print(f"Error inesperado al crear venta en caja: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error inesperado al crear la venta.")

    # Cargar relaciones para la respuesta completa
    sale_for_response = db.query(Sale).options(
        selectinload(Sale.user),
        selectinload(Sale.line_of_sales).selectinload(LineOfSale.product) # Carga producto activo o inactivo
    ).filter(Sale.id == nueva_venta.id).one_or_none()

    if not sale_for_response:
         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al recuperar la venta de caja creada.")

    return sale_for_response


@router.put("/{sale_id}/register", response_model=SaleAdminView)
def register_sale_in_caja_admin(
    sale_id: int,
    db: Session = Depends(get_db),
    admin_user: UserSchema = Depends(require_admin) # Requiere admin
):
    """
    Marca una venta online como registrada/retirada. Descuenta stock. Valida producto activo. (Admin)
    """
    # Cargar la venta y sus líneas/productos eficientemente
    sale = db.query(Sale).options(
        selectinload(Sale.line_of_sales).selectinload(LineOfSale.product)
    ).filter(Sale.id == sale_id).first()

    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Venta con id {sale_id} no encontrada"
        )

    if not sale.order_confirmed:
         raise HTTPException(
             status_code=status.HTTP_400_BAD_REQUEST,
             detail=f"El pedido {sale_id} debe estar confirmado antes de registrar el retiro."
         )

    if sale.sale_in_register:
        return sale # Ya está registrada, idempotente

    try:
        for line in sale.line_of_sales:
            # Re-obtener producto con bloqueo para actualizar stock
            product_to_update = db.query(Product).filter(Product.id == line.product_id).with_for_update().first()

            if not product_to_update:
                 raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error de integridad: Producto ID {line.product_id} no encontrado para la línea {line.id}.")

            # --- VALIDACIÓN SOFT DELETE (al momento del retiro) ---
            if not product_to_update.is_active:
                 raise HTTPException(
                     status_code=status.HTTP_400_BAD_REQUEST,
                     detail=f"El producto '{product_to_update.nombre}' fue desactivado y no se puede completar el retiro."
                 )
            # ---------------------------------------------------

            # Re-verificar stock al momento del retiro
            if product_to_update.stock < line.cantidad:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Stock insuficiente para '{product_to_update.nombre}' al momento del retiro. Stock actual: {product_to_update.stock}, Pedido: {line.cantidad}"
                )
            # Descontar stock AHORA
            product_to_update.stock -= line.cantidad

        # Marcar como registrada
        sale.sale_in_register = True

        db.commit() # Guardar cambios en stock y estado de la venta

    except HTTPException as http_exc:
        db.rollback()
        raise http_exc
    except SQLAlchemyError as e:
         db.rollback()
         print(f"Error de base de datos al registrar venta {sale_id}: {e}")
         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno al registrar el retiro.")
    except Exception as e:
        db.rollback()
        print(f"Error inesperado al registrar venta {sale_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error inesperado al registrar el retiro.")

    # Recargar con relaciones para la respuesta completa
    sale_for_response = db.query(Sale).options(
        selectinload(Sale.user),
        selectinload(Sale.line_of_sales).selectinload(LineOfSale.product)
    ).filter(Sale.id == sale.id).one_or_none()

    if not sale_for_response:
         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al recuperar la venta registrada.")

    return sale_for_response


# GET - Pedidos del usuario actual listos para retirar
@router.get("/my-orders/ready-for-pickup", response_model=List[SaleAdminView])
def get_my_ready_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Usar Modelo User
):
    """
    Obtiene los pedidos del usuario autenticado que están confirmados
    pero aún no han sido marcados como registrados/retirados.
    """
    try:
        ready_sales = db.query(Sale).options(
            selectinload(Sale.user), # Carga usuario (aunque sea el mismo)
            selectinload(Sale.line_of_sales).selectinload(LineOfSale.product) # Carga producto activo o inactivo
        ).filter(
            Sale.user_id == current_user.id,
            Sale.order_confirmed == True,
            Sale.sale_in_register == False
        ).order_by(Sale.date.desc(), Sale.id.desc()).all()
    except Exception as e:
        print(f"Error fetching ready orders for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Error interno al obtener los pedidos listos para retirar.")

    return ready_sales