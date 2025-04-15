# routes/sales.py
from fastapi import APIRouter, Depends, HTTPException, Body, status 
from sqlalchemy.orm import Session,joinedload 
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

    # --- CAMBIO AQUÍ ---
    # Antes era: (Sale.order_confirmed == True) | (Sale.sale_in_register == True)
    # Ahora es solo:
    sales = db.query(Sale).filter(
        Sale.sale_in_register == True # Solo mostrar las marcadas como registradas/retiradas
    ).order_by(Sale.date.desc()).all() # Mantenemos el orden opcional
    # --- FIN CAMBIO ---

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
    # Usuario fijo para ventas en caja (Asegúrate que el ID 5 exista y sea el correcto)
    usuario_caja_id = 5 
    db_user_caja = db.query(User).filter(User.id == usuario_caja_id).first()
    if not db_user_caja:
         raise HTTPException(
             status_code=status.HTTP_404_NOT_FOUND, 
             detail=f"Usuario de caja con ID {usuario_caja_id} no encontrado."
         )


    # Calcular cantidad total
    total_quantity = sum(line.cantidad for line in venta.lineas)

    nueva_venta = Sale(
        quantity_product=total_quantity,
        observation=venta.observation,
        date=date.today(),
        order_confirmed=True,      # Confirmada por defecto en caja
        sale_in_register=True,     # Registrada por defecto en caja
        pagado=True,               # Pagado por defecto en caja
        medioPago="Caja",          # Medio de pago por defecto
        user_id=usuario_caja_id
    )

    db.add(nueva_venta)
    # Es importante hacer flush aquí para obtener el ID de nueva_venta 
    # antes de crear las líneas, pero el commit final irá después de descontar stock.
    db.flush() 

    nuevas_lineas = []
    productos_modificados = [] # Para refrescar después del commit si es necesario

    # --- INICIO LÓGICA DE STOCK ---
    try:
        for index, linea in enumerate(venta.lineas):
            # Usar with_for_update() para bloquear la fila del producto y evitar race conditions
            producto = db.query(Product).filter(Product.id == linea.product_id).with_for_update().first()
            
            if not producto:
                # Si no se encuentra el producto, revertimos todo y lanzamos error
                db.rollback() 
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Producto con id {linea.product_id} no encontrado")

            # Verificar stock ANTES de crear la línea
            if producto.stock < linea.cantidad:
                db.rollback() # Revertir la transacción
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Stock insuficiente para '{producto.nombre}'. Stock actual: {producto.stock}, Solicitado: {linea.cantidad}"
                )
            
            # Descontar stock
            producto.stock -= linea.cantidad
            productos_modificados.append(producto) # Guardar referencia si necesitas refrescar

            # Crear la línea de venta
            linea_venta = LineOfSale(
                cantidad=linea.cantidad,
                numeroDeLinea=index + 1,
                precio=producto.precioActual, # Usar el precio actual del producto
                sale_id=nueva_venta.id,
                product_id=linea.product_id,
            )
            db.add(linea_venta)
            nuevas_lineas.append(linea_venta)

        # Si todo salió bien, confirmar todos los cambios (venta, líneas, stock)
        db.commit()

    except HTTPException as http_exc:
         # Si hubo un HTTPException (ej. stock insuficiente), ya hicimos rollback
         # Simplemente relanzamos la excepción
         raise http_exc
    except Exception as e:
        # Si hubo cualquier otro error durante el proceso
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error inesperado procesando la venta: {e}"
        )
    # --- FIN LÓGICA DE STOCK ---

    # Refrescar la venta para asegurar que la respuesta incluya todo desde la BD
    db.refresh(nueva_venta)
    # Asignar las líneas creadas para la respuesta (SQLAlchemy puede no cargarlas automáticamente después del commit)
    # Aunque SaleAdminView debería poder cargarlas si las relaciones están bien, 
    # asignarlas explícitamente puede ser más seguro dependiendo de la config.
    # Si usas orm_mode = True y las relaciones están bien, esto podría ser redundante, pero no daña.
    nueva_venta.line_of_sales = nuevas_lineas 

    return nueva_venta




@router.put("/{sale_id}/register", response_model=SaleAdminView)
def register_sale_in_caja_admin(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Marca una venta existente como registrada en caja (sale_in_register = True)
    y descuenta el stock de los productos correspondientes.
    Solo accesible para administradores.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No autorizado para registrar ventas en caja"
        )

    # Cargar la venta y sus líneas de venta y productos asociados eficientemente
    sale = db.query(Sale).options(
        joinedload(Sale.line_of_sales).joinedload(LineOfSale.product) 
    ).filter(Sale.id == sale_id).first()

    if not sale:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Venta con id {sale_id} no encontrada"
        )

    # Evitar doble descuento si ya está registrada
    if sale.sale_in_register:
        # Podrías devolver la venta tal cual o un mensaje específico
         # raise HTTPException(
         #     status_code=status.HTTP_400_BAD_REQUEST,
         #     detail=f"La venta {sale_id} ya está registrada en caja."
         # )
         # O simplemente retornarla sin hacer cambios
         return sale


    # --- LÓGICA DE DESCUENTO DE STOCK ---
    for line in sale.line_of_sales:
        if not line.product: 
             # Esto no debería pasar si la carga fue correcta, pero por seguridad
             raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail=f"No se pudo cargar el producto para la línea {line.id}"
             )

        if line.product.stock < line.cantidad:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, # 409 Conflict es una buena opción
                detail=f"Stock insuficiente para '{line.product.nombre}'. Stock actual: {line.product.stock}, Pedido: {line.cantidad}"
            )

        line.product.stock -= line.cantidad
    # --- FIN LÓGICA DE DESCUENTO DE STOCK ---

    # Marcar como registrada
    sale.sale_in_register = True

    try:
        db.commit()
        db.refresh(sale) # Refrescar sale
        # Refrescar productos individualmente si es necesario ver el stock actualizado inmediatamente en la respuesta
        # (Aunque la respuesta es SaleAdminView, refrescar sale ya podría ser suficiente)
        # for line in sale.line_of_sales:
        #     db.refresh(line.product) 
    except Exception as e:
         db.rollback() # Importante revertir si hay un error durante el commit
         raise HTTPException(
             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
             detail=f"Error al guardar cambios en la base de datos: {e}"
         )

    return sale


# GET - Pedidos del usuario actual listos para retirar
@router.get("/my-orders/ready-for-pickup", response_model=List[SaleAdminView])
def get_my_ready_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene los pedidos del usuario autenticado que están confirmados
    pero aún no han sido marcados como registrados/retirados.
    """
    # (Opcional: Podrías crear un Schema más simple como SaleReadyInfo si no quieres toda la info de SaleAdminView)
    ready_sales = db.query(Sale).filter(
        Sale.user_id == current_user.id,
        Sale.order_confirmed == True,
        Sale.sale_in_register == False
    ).order_by(Sale.date.desc()).all() # Ordenar por fecha descendente opcionalmente

    # Nota: Si usaras un schema más simple, asegúrate de que las relaciones necesarias
    # (como user, line_of_sales.product) se carguen si las necesitas mostrar,
    # o ajusta la query/schema para devolver solo los IDs/datos básicos.
    # Con SaleAdminView, las relaciones ya deberían cargarse si están bien definidas en el schema.

    return ready_sales
