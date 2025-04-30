// src/pages/AdminSales.jsx
// (COMPLETO - Con botón para mostrar resumen histórico)
import React, { useState, useEffect, useCallback } from 'react';
import {
    getPedidosSolicitados,
    getPedidosPendientesRetiro,
    getVentasFinalizadas,
    confirmSale,
    markAsPaid,
    registerSaleInCaja,
    getHistoricalSummary // Importado, ahora se usa bajo demanda
} from '../api/saleService';
import Modal from '../components/Modal';
import CajaSaleForm from '../components/CajaSaleForm';

// Helper formatDateToYYYYMMDD (sin cambios)
const formatDateToYYYYMMDD = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) {
        const today = new Date();
        let month = '' + (today.getMonth() + 1); let day = '' + today.getDate(); const year = today.getFullYear();
        if (month.length < 2) month = '0' + month; if (day.length < 2) day = '0' + day;
        return [year, month, day].join('-');
    }
    let month = '' + (d.getMonth() + 1); let day = '' + d.getDate(); const year = d.getFullYear();
    if (month.length < 2) month = '0' + month; if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
};

// Componente SalesTable (sin cambios)
const SalesTable = ({ title, sales, actions }) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const parts = dateString.split('-');
        if (parts.length !== 3) return dateString;
        const localDate = new Date(parts[0], parts[1] - 1, parts[2]);
        if (isNaN(localDate.getTime())) { return dateString; }
        return localDate.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };
    return (
        <div className="sales-section">
            <h2>{title}</h2>
            {sales.length === 0 ? (
                 <p>No hay {title.toLowerCase().replace(/ \(filtrado.*\)/, '')} por el momento{title.includes('Filtrado') ? ' para la fecha seleccionada' : ''}.</p> // Regex mejorado
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                         {/* ... contenido de la tabla sin cambios ... */}
                           <thead><tr><th>ID Venta</th><th>Usuario</th><th>Email</th><th>Productos (Cantidad)</th><th>Pagado</th><th>Medio Pago</th><th>Observación</th><th>Fecha</th><th>Acciones</th></tr></thead>
                        <tbody>
                            {sales.map((sale) => (
                                <tr key={sale.id}>
                                    <td data-label="ID Venta">{sale.id}</td>
                                    <td data-label="Usuario">{sale.user?.name || 'N/A'}</td>
                                    <td data-label="Email">{sale.user?.email || 'N/A'}</td>
                                    <td data-label="Productos">
                                        {sale.line_of_sales && sale.line_of_sales.length > 0 ? (
                                            <ul style={{ paddingLeft: 0, margin: 0, listStyle: 'none', fontSize: '0.85rem' }}>
                                                {sale.line_of_sales.map(line => (<li key={line.id || line.product?.id || Math.random()}>{line.product?.nombre || 'Producto desconocido'} ({line.cantidad}x)</li>))}
                                            </ul>
                                        ) : ('No hay productos')}
                                    </td>
                                    <td data-label="Pagado">
                                        {actions.canTogglePaid && !sale.pagado && (<button onClick={() => actions.onMarkPaid(sale.id)} title="Marcar como Pagado" className="action-button-small paid-toggle">Pagado</button>)}
                                        {sale.pagado ? 'Sí' : (actions.canTogglePaid ? '' : 'No')}
                                    </td>
                                    <td data-label="Medio Pago">{sale.medioPago || 'Online'}</td>
                                    <td data-label="Observación">{sale.observation || '-'}</td>
                                    <td data-label="Fecha">{formatDate(sale.date)}</td>
                                    <td data-label="Acciones" className="actions">
                                        {actions.canConfirm && !sale.order_confirmed && (<button onClick={() => actions.onConfirm(sale.id)} className="action-button-small confirm">Confirmar</button>)}
                                        {actions.canRegister && sale.order_confirmed && !sale.sale_in_register && (<button onClick={() => actions.onRegister(sale.id)} className="action-button-small register">Registrar Retiro</button>)}
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
    // Estados para las tablas de ventas (sin cambios)
    const [pedidosSolicitados, setPedidosSolicitados] = useState([]);
    const [pendientesRetiro, setPendientesRetiro] = useState([]);
    const [ventasFinalizadas, setVentasFinalizadas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [isCajaModalOpen, setIsCajaModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(formatDateToYYYYMMDD(new Date()));

    // --- ESTADOS PARA RESUMEN HISTÓRICO (AJUSTADOS) ---
    const [historicalSummary, setHistoricalSummary] = useState(null); // Inicia en null
    const [summaryLoading, setSummaryLoading] = useState(false); // Inicia en false
    const [summaryError, setSummaryError] = useState(null);
    const [showSummary, setShowSummary] = useState(false); // Estado para controlar visibilidad
    // -----------------------------------------------

    // fetchData para las tablas (sin cambios funcionales)
    const fetchData = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        setActionLoading(false); setError(null);
        try {
            const [solicitados, pendientes, finalizadas] = await Promise.all([
                getPedidosSolicitados(), getPedidosPendientesRetiro(), getVentasFinalizadas(selectedDate)
            ]);
            setPedidosSolicitados(solicitados); setPendientesRetiro(pendientes); setVentasFinalizadas(finalizadas);
        } catch (err) {
            const errorDetail = err.response?.data?.detail || err.message || 'Error al cargar los datos de ventas.';
            setError(errorDetail); setPedidosSolicitados([]); setPendientesRetiro([]); setVentasFinalizadas([]);
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [selectedDate]);

    // useEffect para cargar datos de las tablas (sin cambios)
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- ELIMINADO: useEffect que cargaba el resumen al montar ---

    // Handler para cambio de fecha (sin cambios)
    const handleDateChange = (event) => {
        setSelectedDate(event.target.value);
    };

    // --- NUEVO HANDLER: Para el botón de mostrar resumen ---
    const handleShowSummaryClick = async () => {
        setShowSummary(true); // Indicar que queremos mostrarlo (o intentarlo)
        setSummaryLoading(true);
        setSummaryError(null);
        setHistoricalSummary(null); // Limpiar datos previos
        try {
            const summaryData = await getHistoricalSummary();
            setHistoricalSummary(summaryData);
        } catch (err) {
            const errorDetail = err.response?.data?.detail || err.message || 'Error al cargar el resumen histórico.';
            setSummaryError(errorDetail);
        } finally {
            setSummaryLoading(false);
        }
    };
    // ----------------------------------------------------

    // handleAction (sin cambios, ya no necesita recargar resumen)
    const handleAction = async (actionPromise, successMessage) => {
        setActionLoading(true); setError(null);
        try {
            await actionPromise; console.log(successMessage);
            await fetchData(false); // Refrescar solo las tablas
        } catch (err) {
            const errorDetail = err.response?.data?.detail || err.message || 'Ocurrió un error al realizar la acción.';
            setError(errorDetail);
        } finally {
            setActionLoading(false);
        }
    };

    // Handlers específicos (sin cambios)
    const handleConfirm = (saleId) => { handleAction(confirmSale(saleId), `Pedido ${saleId} confirmado.`); };
    const handleMarkPaid = (saleId) => { handleAction(markAsPaid(saleId), `Pedido ${saleId} marcado como pagado.`); };
    const handleRegister = (saleId) => { handleAction(registerSaleInCaja(saleId), `Pedido ${saleId} registrado en caja (retirado).`); };
    // handleCajaSaleCreated ahora solo necesita refrescar las tablas
    const handleCajaSaleCreated = () => {
        console.log("Venta en caja creada.");
        setIsCajaModalOpen(false);
        fetchData(false); // Solo refresca las tablas
    };

    // Helper para formatear moneda (sin cambios)
    const formatCurrency = (amount) => {
        return `$${(amount || 0).toFixed(2)}`;
    };

    // --- RENDERIZADO DEL COMPONENTE ---
    return (
        <div className="admin-sales-page">
            <h1>Gestión de Pedidos y Ventas</h1>
            {actionLoading && <p className="loading-inline">Procesando acción...</p>}
            {error && !actionLoading && <p className="error-message">{`Error en tablas: ${error}`}</p>}

            {loading ? (
                <p>Cargando pedidos y ventas...</p>
            ) : (
                <>
                    {/* Tablas de Pedidos y Ventas Finalizadas */}
                    <SalesTable title="Pedidos Solicitados (Online)" sales={pedidosSolicitados} actions={{ canConfirm: true, canTogglePaid: true, onConfirm: handleConfirm, onMarkPaid: handleMarkPaid }} />
                    <SalesTable title="Pedidos Pendientes de Retiro" sales={pendientesRetiro} actions={{ canRegister: true, canTogglePaid: true, onRegister: handleRegister, onMarkPaid: handleMarkPaid }} />
                    <div className="sales-section">
                        <div className="date-selector-inline">
                            <label htmlFor="sales-date">Filtrar Ventas Finalizadas por Fecha:</label>
                            <input type="date" id="sales-date" value={selectedDate} onChange={handleDateChange} disabled={actionLoading || loading} />
                        </div>
                        <SalesTable title={`Ventas Finalizadas (Filtrado: ${selectedDate === formatDateToYYYYMMDD(new Date()) ? 'Hoy' : selectedDate})`} sales={ventasFinalizadas} actions={{ canTogglePaid: false }} />
                    </div>
                </>
            )}

            {/* --- SECCIÓN DE BOTONES DE ACCIÓN --- */}
            <div className="admin-actions-container">
                <div className="manual-sale-section">
                    <h2>Venta Manual en Caja</h2>
                    <button onClick={() => setIsCajaModalOpen(true)} className="manual-sale-button button-info" disabled={actionLoading || loading}> Registrar Venta Manual </button>
                </div>
                <div className="summary-action-section">
                     <h2>Resumen General</h2>
                    {/* Botón para mostrar el resumen */}
                    <button onClick={handleShowSummaryClick} className="summary-button button-secondary" disabled={summaryLoading || actionLoading || loading}>
                        {summaryLoading ? 'Cargando Resumen...' : 'Mostrar Resumen Histórico'}
                    </button>
                </div>
            </div>
             {/* ----------------------------------- */}


            {/* Modal Venta Manual (sin cambios) */}
            <Modal isOpen={isCajaModalOpen} onClose={() => setIsCajaModalOpen(false)}>
                <CajaSaleForm onClose={() => setIsCajaModalOpen(false)} onSaleCreated={handleCajaSaleCreated} />
            </Modal>

            {/* --- SECCIÓN RESUMEN HISTÓRICO (CONDICIONAL) --- */}
            {/* Solo se muestra si se hizo clic en el botón (showSummary=true) */}
            {showSummary && (
                <div className="historical-summary-section">
                    <h2>Resumen Histórico (Ventas Registradas)</h2>
                    {summaryLoading ? (
                        <p>Cargando resumen...</p>
                    ) : summaryError ? (
                        <p className="error-message">{`Error en resumen: ${summaryError}`}</p>
                    ) : historicalSummary && historicalSummary.products ? (
                        <>
                            {historicalSummary.products.length > 0 ? (
                                <ul className="product-summary-list">
                                    {historicalSummary.products.map((prod) => (
                                        <li key={prod.product_name} className="product-summary-item">
                                            <strong>{prod.product_name}:</strong> {prod.total_units_sold} unidades | {formatCurrency(prod.total_revenue)} generados
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No hay datos de ventas registradas.</p> // Mensaje si no hay productos en el resumen
                            )}
                            <p className="overall-total">
                                <strong>Ingresos Totales Históricos (Ventas Registradas): {formatCurrency(historicalSummary.overall_total_revenue)}</strong>
                            </p>
                        </>
                    ) : (
                         // Si no está cargando, no hay error, pero tampoco datos (después de intentar cargar)
                        <p>No se pudo obtener el resumen.</p>
                    )}
                </div>
            )}
            {/* --- FIN SECCIÓN RESUMEN --- */}

        </div>
    );
};

export default AdminSales;