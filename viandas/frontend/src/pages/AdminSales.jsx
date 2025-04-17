// src/pages/AdminSales.jsx
// (COMPLETO Y CORREGIDO con filtro de fecha para Ventas Finalizadas)
import React, { useState, useEffect, useCallback } from 'react';
import {
    getPedidosSolicitados,
    getPedidosPendientesRetiro,
    getVentasFinalizadas, // Esta función ya fue modificada en saleService.js para aceptar fecha
    confirmSale,
    markAsPaid,
    registerSaleInCaja
} from '../api/saleService';
import Modal from '../components/Modal';
import CajaSaleForm from '../components/CajaSaleForm';

// --- NUEVO: Helper para formatear Date a YYYY-MM-DD ---
// Necesario para el input date y la llamada API
const formatDateToYYYYMMDD = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) {
        const today = new Date();
        let month = '' + (today.getMonth() + 1);
        let day = '' + today.getDate();
        const year = today.getFullYear();
        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
        return [year, month, day].join('-'); // Fallback
    }
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
};
// --- FIN NUEVO ---

// Componente SalesTable (sin cambios respecto a tu última versión)
const SalesTable = ({ title, sales, actions }) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const parts = dateString.split('-');
        if (parts.length !== 3) return dateString;
        const localDate = new Date(parts[0], parts[1] - 1, parts[2]);
        if (isNaN(localDate.getTime())) {
            return dateString;
        }
        return localDate.toLocaleDateString('es-AR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    return (
        <div className="sales-section">
            <h2>{title}</h2>
            {sales.length === 0 ? (
                <p>No hay {title.toLowerCase().replace(' (filtrado)', '')} por el momento{title.includes('Filtrado') ? ' para la fecha seleccionada' : ''}.</p> // Mensaje adaptado
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID Venta</th>
                                <th>Usuario</th>
                                <th>Email</th>
                                <th>Productos (Cantidad)</th>
                                <th>Pagado</th>
                                <th>Medio Pago</th>
                                <th>Observación</th>
                                <th>Fecha</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map((sale) => (
                                <tr key={sale.id}>
                                    <td data-label="ID Venta">{sale.id}</td>
                                    <td data-label="Usuario">{sale.user?.name || 'N/A'}</td>
                                    <td data-label="Email">{sale.user?.email || 'N/A'}</td>
                                    <td data-label="Productos">
                                        {sale.line_of_sales && sale.line_of_sales.length > 0 ? (
                                            <ul style={{ paddingLeft: 0, margin: 0, listStyle: 'none', fontSize: '0.85rem' }}>
                                                {sale.line_of_sales.map(line => (
                                                    <li key={line.id || line.product?.id || Math.random()}>
                                                        {line.product?.nombre || 'Producto desconocido'} ({line.cantidad}x)
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : ('No hay productos')}
                                    </td>
                                    <td data-label="Pagado">
                                        {actions.canTogglePaid && !sale.pagado && (
                                            <button
                                                onClick={() => actions.onMarkPaid(sale.id)}
                                                title="Marcar como Pagado"
                                                className="action-button-small paid-toggle"
                                            >
                                                Pagado
                                            </button>
                                        )}
                                        {sale.pagado ? 'Sí' : (actions.canTogglePaid ? '' : 'No')}
                                    </td>
                                    <td data-label="Medio Pago">{sale.medioPago || 'Online'}</td>
                                    <td data-label="Observación">{sale.observation || '-'}</td>
                                    <td data-label="Fecha">{formatDate(sale.date)}</td>
                                    <td data-label="Acciones" className="actions">
                                        {actions.canConfirm && !sale.order_confirmed && (
                                            <button onClick={() => actions.onConfirm(sale.id)} className="action-button-small confirm">Confirmar</button>
                                        )}
                                        {actions.canRegister && sale.order_confirmed && !sale.sale_in_register && (
                                            <button onClick={() => actions.onRegister(sale.id)} className="action-button-small register">Registrar Retiro</button>
                                        )}
                                        {/* Aquí podrías añadir otros botones si fuera necesario */}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};


const AdminSales = () => {
    const [pedidosSolicitados, setPedidosSolicitados] = useState([]);
    const [pendientesRetiro, setPendientesRetiro] = useState([]);
    const [ventasFinalizadas, setVentasFinalizadas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [isCajaModalOpen, setIsCajaModalOpen] = useState(false);

    // --- NUEVO ESTADO PARA LA FECHA ---
    const [selectedDate, setSelectedDate] = useState(formatDateToYYYYMMDD(new Date()));
    // ----------------------------------

    // --- MODIFICADO fetchData ---
    const fetchData = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        setActionLoading(false); // Asegurar que el loader de acción se apague
        setError(null);
        try {
            // Llamada a getVentasFinalizadas ahora incluye selectedDate
            const [solicitados, pendientes, finalizadas] = await Promise.all([
                getPedidosSolicitados(),
                getPedidosPendientesRetiro(),
                getVentasFinalizadas(selectedDate) // <-- Pasar la fecha seleccionada aquí
            ]);
            setPedidosSolicitados(solicitados);
            setPendientesRetiro(pendientes);
            setVentasFinalizadas(finalizadas);
        } catch (err) {
            const errorDetail = err.response?.data?.detail || err.message || 'Error al cargar los datos de ventas.';
            setError(errorDetail);
            // Limpiar todos los estados en caso de error
            setPedidosSolicitados([]);
            setPendientesRetiro([]);
            setVentasFinalizadas([]);
        } finally {
            if (showLoading) setLoading(false);
        }
        // Añadir selectedDate a las dependencias de useCallback
    }, [selectedDate]);
    // --- FIN MODIFICACIÓN fetchData ---

    // useEffect ahora depende de fetchData (que a su vez depende de selectedDate)
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- NUEVO HANDLER PARA CAMBIO DE FECHA ---
    const handleDateChange = (event) => {
        setSelectedDate(event.target.value);
        // fetchData se ejecutará automáticamente por el cambio en selectedDate (vía useEffect)
    };
    // -----------------------------------------

    // handleAction (sin cambios necesarios aquí)
    const handleAction = async (actionPromise, successMessage) => {
        setActionLoading(true);
        setError(null);
        try {
            await actionPromise;
            console.log(successMessage);
            // Refrescar datos sin mostrar el spinner de carga principal
            await fetchData(false);
        } catch (err) {
            const errorDetail = err.response?.data?.detail || err.message || 'Ocurrió un error al realizar la acción.';
            setError(errorDetail);
        } finally {
            setActionLoading(false);
        }
    };

    // Handlers específicos (sin cambios necesarios aquí)
    const handleConfirm = (saleId) => { handleAction(confirmSale(saleId), `Pedido ${saleId} confirmado.`); };
    const handleMarkPaid = (saleId) => { handleAction(markAsPaid(saleId), `Pedido ${saleId} marcado como pagado.`); };
    const handleRegister = (saleId) => { handleAction(registerSaleInCaja(saleId), `Pedido ${saleId} registrado en caja (retirado).`); };
    const handleCajaSaleCreated = () => { console.log("Venta en caja creada."); setIsCajaModalOpen(false); fetchData(false); };

    if (loading) { return <p>Cargando pedidos y ventas...</p>; }

    return (
        <div className="admin-sales-page">
            <h1>Gestión de Pedidos y Ventas</h1>
            {/* Mostrar loader de acción o error general */}
            {actionLoading && <p className="loading-inline">Procesando acción...</p>}
            {error && !actionLoading && <p className="error-message">{`Error: ${error}`}</p>}

            {/* Tabla Pedidos Solicitados (sin cambios) */}
            <SalesTable
                title="Pedidos Solicitados (Online)"
                sales={pedidosSolicitados}
                actions={{ canConfirm: true, canTogglePaid: true, onConfirm: handleConfirm, onMarkPaid: handleMarkPaid }}
            />

            {/* Tabla Pendientes de Retiro (sin cambios) */}
            <SalesTable
                title="Pedidos Pendientes de Retiro"
                sales={pendientesRetiro}
                actions={{ canRegister: true, canTogglePaid: true, onRegister: handleRegister, onMarkPaid: handleMarkPaid }}
            />

             {/* --- SECCIÓN VENTAS FINALIZADAS CON SELECTOR DE FECHA --- */}
            <div className="sales-section"> {/* Envolver selector y tabla */}
                 {/* --- INPUT DE FECHA --- */}
                <div className="date-selector-inline">
                    <label htmlFor="sales-date">Filtrar Ventas Finalizadas por Fecha:</label>
                    <input
                        type="date"
                        id="sales-date"
                        value={selectedDate}
                        onChange={handleDateChange}
                        disabled={actionLoading || loading} // Deshabilitar si carga o procesa
                    />
                </div>
                 {/* --------------------- */}

                <SalesTable
                    // Modificar título dinámicamente si se desea
                    title={`Ventas Finalizadas (Filtrado: ${selectedDate === formatDateToYYYYMMDD(new Date()) ? 'Hoy' : selectedDate})`}
                    sales={ventasFinalizadas}
                    actions={{ canTogglePaid: false }} // Asumo que no se puede des-pagar aquí
                />
            </div>
             {/* --- FIN SECCIÓN VENTAS FINALIZADAS --- */}


            {/* Sección Venta Manual (sin cambios) */}
            <div className="manual-sale-section" style={{ marginTop: '30px', borderTop: '1px solid #ccc', paddingTop: '20px' }}>
                <h2>Venta Manual en Caja</h2>
                <button onClick={() => setIsCajaModalOpen(true)} className="manual-sale-button button-info"> Registrar Venta Manual </button>
            </div>
            <Modal isOpen={isCajaModalOpen} onClose={() => setIsCajaModalOpen(false)}>
                <CajaSaleForm onClose={() => setIsCajaModalOpen(false)} onSaleCreated={handleCajaSaleCreated} />
            </Modal>
        </div>
    );
};

export default AdminSales;