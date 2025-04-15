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

// Componente SalesTable modificado con data-label
const SalesTable = ({ title, sales, actions }) => (
  <div className="sales-section">
    <h2>{title}</h2>
    {sales.length === 0 ? (
      <p>No hay {title.toLowerCase()} por el momento.</p>
    ) : (
      <div style={{ overflowX: 'auto' }}> {/* Añadir wrapper para scroll horizontal si no se usa CSS responsivo de apilamiento */}
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
                {/* Añadir data-label a cada td */}
                <td data-label="ID Venta">{sale.id}</td>
                <td data-label="Usuario">{sale.user?.name || 'N/A'}</td>
                <td data-label="Email">{sale.user?.email || 'N/A'}</td>
                <td data-label="Productos">
                  {sale.line_of_sales && sale.line_of_sales.length > 0 ? (
                    <ul>
                      {sale.line_of_sales.map(line => (
                        <li key={line.id || line.product?.id || Math.random()}>
                          {line.product?.nombre || 'Producto Desconocido'} ({line.cantidad}x)
                        </li>
                      ))}
                    </ul>
                  ) : (
                    'No hay productos'
                  )}
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
                <td data-label="Fecha">{new Date(sale.date).toLocaleDateString()}</td>
                <td data-label="Acciones" className="actions">
                  {actions.canConfirm && !sale.order_confirmed && (
                    <button onClick={() => actions.onConfirm(sale.id)} className="action-button-small confirm">Confirmar</button>
                  )}
                  {actions.canRegister && sale.order_confirmed && !sale.sale_in_register && (
                    <button onClick={() => actions.onRegister(sale.id)} className="action-button-small register">Registrar Retiro</button>
                  )}
                  {/* Puedes añadir más botones aquí */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);


const AdminSales = () => {
  const [pedidosSolicitados, setPedidosSolicitados] = useState([]);
  const [pendientesRetiro, setPendientesRetiro] = useState([]);
  const [ventasFinalizadas, setVentasFinalizadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false); // Loading para acciones
  const [isCajaModalOpen, setIsCajaModalOpen] = useState(false);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const [solicitados, pendientes, finalizadas] = await Promise.all([
        getPedidosSolicitados(),
        getPedidosPendientesRetiro(),
        getVentasFinalizadas()
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
  }, []); // No dependencies needed if it always fetches all

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (actionPromise, successMessage) => {
     setActionLoading(true); // Usar loading de acción
     setError(null);
     try {
       await actionPromise;
       console.log(successMessage);
       await fetchData(false); // Recargar datos sin mostrar el spinner general
     } catch (err) {
       const errorDetail = err.response?.data?.detail || err.message || 'Ocurrió un error al realizar la acción.';
       setError(errorDetail);
       // Considerar no limpiar los datos existentes en caso de error de acción
     } finally {
        setActionLoading(false);
     }
  };

  const handleConfirm = (saleId) => {
     handleAction(confirmSale(saleId), `Pedido ${saleId} confirmado.`);
  };

  const handleMarkPaid = (saleId) => {
     handleAction(markAsPaid(saleId), `Pedido ${saleId} marcado como pagado.`);
  };

  const handleRegister = (saleId) => {
     handleAction(registerSaleInCaja(saleId), `Pedido ${saleId} registrado en caja (retirado).`);
  };

  const handleCajaSaleCreated = () => {
    console.log("Venta en caja creada exitosamente.");
    setIsCajaModalOpen(false);
    fetchData(false); // Recarga sin spinner general
  };

  // Renderizado
  if (loading) {
    return <p>Cargando pedidos y ventas...</p>;
  }

  return (
    <div className="admin-sales-page">
      <h1>Gestión de Pedidos y Ventas</h1>
      {actionLoading && <p>Procesando acción...</p>} {/* Indicador de acción */}
      {error && <p className="error">{`Error: ${error}`}</p>}

      <SalesTable
        title="Pedidos Solicitados (Online)"
        sales={pedidosSolicitados}
        actions={{
          canConfirm: true,
          canTogglePaid: true,
          onConfirm: handleConfirm,
          onMarkPaid: handleMarkPaid,
        }}
      />

      <SalesTable
        title="Pedidos Pendientes de Retiro"
        sales={pendientesRetiro}
        actions={{
          canRegister: true,
          canTogglePaid: true,
          onRegister: handleRegister,
          onMarkPaid: handleMarkPaid,
        }}
      />

      <SalesTable
        title="Ventas Finalizadas (Incluye Retirados y Ventas de Caja)"
        sales={ventasFinalizadas}
        actions={{
           canTogglePaid: false, // No se puede cambiar pagado aquí
        }}
      />

      <div className="manual-sale-section" style={{ marginTop: '30px', borderTop: '1px solid #ccc', paddingTop: '20px' }}>
         <h2>Venta Manual en Caja</h2>
         <button
           onClick={() => setIsCajaModalOpen(true)}
           className="manual-sale-button button-info" /* Use a different color maybe */
         >
           Registrar Venta Manual
         </button>
       </div>

       <Modal isOpen={isCajaModalOpen} onClose={() => setIsCajaModalOpen(false)}>
          <CajaSaleForm
             onClose={() => setIsCajaModalOpen(false)}
             onSaleCreated={handleCajaSaleCreated}
          />
       </Modal>
    </div>
  );
};

export default AdminSales;