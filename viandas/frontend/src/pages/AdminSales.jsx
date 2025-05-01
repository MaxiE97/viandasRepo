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

    // --- MODIFICACIÓN EN handleRegister ---
    const handleRegister = (saleId) => {
        // 1. Buscar la venta en el estado 'pendientesRetiro'
        const saleToRegister = pendientesRetiro.find(sale => sale.id === saleId);

        // 2. Verificar si se encontró la venta y si está pagada
        if (!saleToRegister) {
            console.error("Error: No se encontró la venta con ID:", saleId);
            setError("Error interno: No se pudo encontrar la venta para registrar.");
            return; // Salir si no se encuentra
        }

        if (!saleToRegister.pagado) {
            // 3. Si no está pagada, mostrar alerta y no continuar
            window.alert(`El pedido #${saleId} debe estar marcado como "Pagado" antes de poder registrar el retiro.`);
            return; // Detener la ejecución
        }

        // 4. Si está pagada, proceder con la acción original
        handleAction(
            registerSaleInCaja(saleId),
            `Pedido ${saleId} registrado en caja (retirado).`
        );
    };

    // Handlers específicos (sin cambios)
    const handleConfirm = (saleId) => { handleAction(confirmSale(saleId), `Pedido ${saleId} confirmado.`); };
    const handleMarkPaid = (saleId) => { handleAction(markAsPaid(saleId), `Pedido ${saleId} marcado como pagado.`); };
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
            {/* Indicador de carga para acciones */}
            {actionLoading && <p className="loading-inline">Procesando acción...</p>}
            {/* Mostrar error general solo si no hay acción en curso */}
            {error && !actionLoading && <p className="error-message">{`Error: ${error}`}</p>}

            {/* Indicador de carga principal */}
            {loading ? (
                <p>Cargando pedidos y ventas...</p>
            ) : (
                <>
                    {/* Tabla Pedidos Solicitados (Online) */}
                    <SalesTable
                        title="Pedidos Solicitados (Online)"
                        sales={pedidosSolicitados}
                        actions={{
                            canConfirm: true,        // Se pueden confirmar
                            canTogglePaid: true,     // Se pueden marcar como pagado
                            onConfirm: handleConfirm,
                            onMarkPaid: handleMarkPaid,
                            canRegister: false       // No se registra retiro desde aquí
                        }}
                    />

                    {/* Tabla Pedidos Pendientes de Retiro */}
                    <SalesTable
                        title="Pedidos Pendientes de Retiro"
                        sales={pendientesRetiro}
                        actions={{
                            canConfirm: false,       // Ya no se confirman
                            canTogglePaid: true,     // Se pueden marcar como pagado
                            canRegister: true,       // Se puede registrar retiro
                            onRegister: handleRegister, // <--- Pasa la función modificada
                            onMarkPaid: handleMarkPaid
                        }}
                    />

                    {/* Sección Ventas Finalizadas (Registradas en Caja) */}
                    <div className="sales-section">
                        <div className="date-selector-inline">
                            <label htmlFor="sales-date">Filtrar Ventas Finalizadas por Fecha:</label>
                            <input
                                type="date"
                                id="sales-date"
                                value={selectedDate}
                                onChange={handleDateChange}
                                disabled={actionLoading || loading}
                            />
                        </div>
                        <SalesTable
                            title={`Ventas Finalizadas (Filtrado: ${selectedDate === formatDateToYYYYMMDD(new Date()) ? 'Hoy' : selectedDate})`}
                            sales={ventasFinalizadas}
                            actions={{
                                canTogglePaid: false // No se puede cambiar estado pagado en ventas ya finalizadas
                                // No hay más acciones aquí (confirmar/registrar ya ocurrieron)
                            }}
                        />
                    </div>
                </>
            )}

            {/* --- SECCIÓN DE BOTONES DE ACCIÓN --- */}
            <div className="admin-actions-container">
                <div className="manual-sale-section">
                    <h2>Venta Manual en Caja</h2>
                    <button
                        onClick={() => setIsCajaModalOpen(true)}
                        className="manual-sale-button button-info"
                        disabled={actionLoading || loading}>
                        Registrar Venta Manual
                    </button>
                </div>
                <div className="summary-action-section">
                    <h2>Resumen General</h2>
                    {/* Botón para mostrar el resumen */}
                    <button
                        onClick={handleShowSummaryClick}
                        className="summary-button button-secondary"
                        disabled={summaryLoading || actionLoading || loading}>
                        {summaryLoading ? 'Cargando Resumen...' : 'Mostrar Resumen Histórico'}
                    </button>
                </div>
            </div>
            {/* ----------------------------------- */}


            {/* Modal para Venta Manual en Caja */}
            <Modal isOpen={isCajaModalOpen} onClose={() => setIsCajaModalOpen(false)}>
                <CajaSaleForm
                    onClose={() => setIsCajaModalOpen(false)}
                    onSaleCreated={handleCajaSaleCreated}
                />
            </Modal>

            {/* --- SECCIÓN RESUMEN HISTÓRICO (CONDICIONAL) --- */}
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
                                <p>No hay datos de ventas registradas para mostrar.</p>
                            )}
                            <p className="overall-total">
                                <strong>Ingresos Totales Históricos (Ventas Registradas): {formatCurrency(historicalSummary.overall_total_revenue)}</strong>
                            </p>
                        </>
                    ) : (
                        <p>No se pudo obtener el resumen.</p>
                    )}
                </div>
            )}
            {/* --- FIN SECCIÓN RESUMEN --- */}

        </div>
    );
};

export default AdminSales;