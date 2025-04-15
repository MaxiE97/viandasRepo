// src/pages/AdminSales.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  getPedidosSolicitados,
  getPedidosPendientesRetiro,
  getVentasFinalizadas,
  confirmSale,
  markAsPaid,
  registerSaleInCaja
} from '../api/saleService';
// Quitamos '../App.css'; si los estilos están centralizados en App.css
import Modal from '../components/Modal';
import CajaSaleForm from '../components/CajaSaleForm';

// Componente SalesTable modificado con data-label y formatDate
const SalesTable = ({ title, sales, actions }) => {

  // --- NUEVO: Función para formatear fecha ---
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    // Divide el string 'YYYY-MM-DD' y crea la fecha localmente
    // para evitar problemas de timezone con new Date(string)
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString; // Devuelve original si no es el formato esperado
    // Mes es 0-indexado en el constructor de Date
    const localDate = new Date(parts[0], parts[1] - 1, parts[2]);
    // Comprueba si la fecha es válida antes de formatear
    if (isNaN(localDate.getTime())) {
        return dateString; // Devuelve el string original si la fecha no es válida
    }
    return localDate.toLocaleDateString('es-AR', {
        day: '2-digit', // ej: 05
        month: '2-digit', // ej: 04
        year: 'numeric' // ej: 2025
    }); // Formato DD/MM/YYYY para Argentina
  };
  // --- FIN NUEVO ---

  return (
    <div className="sales-section">
      <h2>{title}</h2>
      {sales.length === 0 ? (
        <p>No hay {title.toLowerCase()} por el momento.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}> {/* Wrapper para scroll horizontal */}
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
                <th>Fecha</th> {/* Columna afectada */}
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
                    ) : ( 'No hay productos' )}
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
                  {/* --- CAMBIO: Usar formatDate --- */}
                  <td data-label="Fecha">{formatDate(sale.date)}</td>
                  {/* ---------------------------- */}
                  <td data-label="Acciones" className="actions">
                    {actions.canConfirm && !sale.order_confirmed && (
                      <button onClick={() => actions.onConfirm(sale.id)} className="action-button-small confirm">Confirmar</button>
                    )}
                    {actions.canRegister && sale.order_confirmed && !sale.sale_in_register && (
                      <button onClick={() => actions.onRegister(sale.id)} className="action-button-small register">Registrar Retiro</button>
                    )}
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

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const [solicitados, pendientes, finalizadas] = await Promise.all([
        getPedidosSolicitados(),
        getPedidosPendientesRetiro(),
        getVentasFinalizadas() // Asume que la lógica del backend es correcta ahora
      ]);
      setPedidosSolicitados(solicitados);
      setPendientesRetiro(pendientes);
      setVentasFinalizadas(finalizadas);
    } catch (err) {
      const errorDetail = err.response?.data?.detail || err.message || 'Error al cargar los datos de ventas.';
      setError(errorDetail);
      setPedidosSolicitados([]);
      setPendientesRetiro([]);
      setVentasFinalizadas([]);
    } finally {
       if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (actionPromise, successMessage) => {
     setActionLoading(true);
     setError(null);
     try {
       await actionPromise;
       console.log(successMessage);
       await fetchData(false);
     } catch (err) {
       const errorDetail = err.response?.data?.detail || err.message || 'Ocurrió un error al realizar la acción.';
       setError(errorDetail);
     } finally {
        setActionLoading(false);
     }
  };

  const handleConfirm = (saleId) => { handleAction(confirmSale(saleId), `Pedido ${saleId} confirmado.`); };
  const handleMarkPaid = (saleId) => { handleAction(markAsPaid(saleId), `Pedido ${saleId} marcado como pagado.`); };
  const handleRegister = (saleId) => { handleAction(registerSaleInCaja(saleId), `Pedido ${saleId} registrado en caja (retirado).`); };
  const handleCajaSaleCreated = () => { console.log("Venta en caja creada."); setIsCajaModalOpen(false); fetchData(false); };

  if (loading) { return <p>Cargando pedidos y ventas...</p>; }

  return (
    <div className="admin-sales-page">
      <h1>Gestión de Pedidos y Ventas</h1>
      {actionLoading && <p>Procesando acción...</p>}
      {error && <p className="error">{`Error: ${error}`}</p>}

      <SalesTable
        title="Pedidos Solicitados (Online)"
        sales={pedidosSolicitados}
        actions={{ canConfirm: true, canTogglePaid: true, onConfirm: handleConfirm, onMarkPaid: handleMarkPaid }}
      />
      <SalesTable
        title="Pedidos Pendientes de Retiro"
        sales={pendientesRetiro}
        actions={{ canRegister: true, canTogglePaid: true, onRegister: handleRegister, onMarkPaid: handleMarkPaid }}
      />
      <SalesTable
        title="Ventas Finalizadas (Retirados y Ventas de Caja)"
        sales={ventasFinalizadas}
        actions={{ canTogglePaid: false }}
      />
      <div className="manual-sale-section" style={{ marginTop: '30px', borderTop: '1px solid #ccc', paddingTop: '20px' }}>
         <h2>Venta Manual en Caja</h2>
         <button onClick={() => setIsCajaModalOpen(true)} className="manual-sale-button button-info" > Registrar Venta Manual </button>
       </div>
       <Modal isOpen={isCajaModalOpen} onClose={() => setIsCajaModalOpen(false)}>
          <CajaSaleForm onClose={() => setIsCajaModalOpen(false)} onSaleCreated={handleCajaSaleCreated} />
       </Modal>
    </div>
  );
};

export default AdminSales;