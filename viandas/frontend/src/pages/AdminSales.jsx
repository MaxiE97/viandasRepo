// src/pages/AdminSales.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  getPedidosSolicitados, 
  getPedidosPendientesRetiro, 
  getVentasFinalizadas,
  confirmSale,
  markAsPaid,
  registerSaleInCaja // La función que asume el endpoint backend
  // createCajaSale // Importar si implementas el modal de venta en caja
} from '../api/saleService';
import '../App.css'; // Reutiliza estilos generales o crea uno específico
import Modal from '../components/Modal'; // Importa tu componente Modal
import CajaSaleForm from '../components/CajaSaleForm'; // Importa el nuevo formulario


// Componente auxiliar para renderizar una tabla de ventas
const SalesTable = ({ title, sales, actions }) => (
  <div className="sales-section">
    <h2>{title}</h2>
    {sales.length === 0 ? (
      <p>No hay {title.toLowerCase()} por el momento.</p>
    ) : (
      <table className="admin-table"> {/* Reutiliza estilos de tabla admin */}
        <thead>
          <tr>
            <th>ID Venta</th>
            <th>Usuario</th>
            <th>Email</th>
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
              <td>{sale.id}</td>
              <td>{sale.user?.name || 'N/A'}</td> {/* Muestra nombre o N/A */}
              <td>{sale.user?.email || 'N/A'}</td> {/* Muestra email o N/A */}
              <td>
                {/* Icono/Checkbox editable para 'pagado' en las primeras 2 secciones */}
                {actions.canTogglePaid && !sale.pagado && (
                   <button 
                      onClick={() => actions.onMarkPaid(sale.id)} 
                      title="Marcar como Pagado"
                      className="action-button-small paid-toggle" // Clase para estilos
                    >
                     Marcar Pagado
                   </button>
                )}
                 {/* Muestra estado si ya está pagado o en la 3ra sección */}
                {sale.pagado ? 'Sí' : (actions.canTogglePaid ? '' : 'No')} 
              </td>
              <td>{sale.medioPago || 'Online'}</td> {/* Muestra medio de pago o 'Online' */}
               <td>{sale.observation || '-'}</td>
               <td>{sale.date}</td>
              <td>
                {/* Botones de acción condicionales */}
                {actions.canConfirm && !sale.order_confirmed && (
                  <button onClick={() => actions.onConfirm(sale.id)} className="action-button-small confirm">Confirmar</button>
                )}
                {actions.canRegister && sale.order_confirmed && !sale.sale_in_register && (
                  <button onClick={() => actions.onRegister(sale.id)} className="action-button-small register">Registrar en Caja</button>
                )}
                {/* Podrías añadir un botón 'Ver Detalles' aquí si lo necesitas */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

const AdminSales = () => {
  const [pedidosSolicitados, setPedidosSolicitados] = useState([]);
  const [pendientesRetiro, setPendientesRetiro] = useState([]);
  const [ventasFinalizadas, setVentasFinalizadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isCajaModalOpen, setIsCajaModalOpen] = useState(false);


  // Función para cargar/recargar todos los datos
  const fetchData = useCallback(async () => {
    setLoading(true);
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
      setError(err.message || 'Error al cargar los datos de ventas.');
      setPedidosSolicitados([]);
      setPendientesRetiro([]);
      setVentasFinalizadas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Manejadores de Acciones ---
  const handleAction = async (actionPromise, successMessage) => {
     setLoading(true); // Podrías tener loadings más específicos por tabla/acción
     setError(null);
     try {
       await actionPromise;
       console.log(successMessage); // O mostrar un toast/notificación
       await fetchData(); // Recargar datos después de la acción
     } catch (err) {
       setError(err.message || 'Ocurrió un error al realizar la acción.');
     } finally {
        // setLoading(false); // Se quita al final de fetchData
     }
  };

  const handleConfirm = (saleId) => {
     handleAction(confirmSale(saleId), `Pedido ${saleId} confirmado.`);
  };

  const handleMarkPaid = (saleId) => {
     // Nota: Esto solo marca como pagado, no desmarca.
     handleAction(markAsPaid(saleId), `Pedido ${saleId} marcado como pagado.`);
  };
  
  const handleRegister = (saleId) => {
      // !!! USA LA FUNCIÓN QUE ASUME EL ENDPOINT FALTANTE !!!
     handleAction(registerSaleInCaja(saleId), `Pedido ${saleId} registrado en caja.`);
  };

    // --- Función para manejar el éxito de creación de venta en caja ---
    const handleCajaSaleCreated = () => {
      console.log("Venta en caja creada exitosamente.");
      setIsCajaModalOpen(false); // Cierra el modal
      fetchData(); // Recarga todas las listas (la nueva venta aparecerá en 'Ventas Finalizadas')
   };

  // --- Renderizado ---
  if (loading && pedidosSolicitados.length === 0 && pendientesRetiro.length === 0 && ventasFinalizadas.length === 0) {
    // Muestra 'Cargando...' solo la primera vez o si todo está vacío
    return <p>Cargando pedidos y ventas...</p>;
 }
  

  return (
    <div className="admin-sales-page">
      <h1>Gestión de Pedidos y Ventas</h1>
      {error && <p className="error" style={{ color: 'red', border: '1px solid red', padding: '10px', marginBottom: '15px' }}>Error: {error}</p>}

      {/* Tabla 1: Pedidos Solicitados */}
      <SalesTable 
        title="Pedidos Solicitados (Online)" 
        sales={pedidosSolicitados}
        actions={{
          canConfirm: true,
          canTogglePaid: true, // Permitir marcar como pagado aquí
          onConfirm: handleConfirm,
          onMarkPaid: handleMarkPaid,
          // No se puede registrar aún
        }}
      />

      {/* Tabla 2: Pendientes de Retiro */}
      <SalesTable 
        title="Pedidos Pendientes de Retiro" 
        sales={pendientesRetiro}
        actions={{
          canRegister: true, // Permitir registrar aquí
          canTogglePaid: true, // Permitir marcar como pagado aquí también
          onRegister: handleRegister,
          onMarkPaid: handleMarkPaid,
           // Ya no se puede confirmar
        }}
      />

      {/* Tabla 3: Ventas Finalizadas */}
      <SalesTable 
        title="Ventas Finalizadas" 
        sales={ventasFinalizadas}
        actions={{
          // No hay acciones en esta tabla
        }} 
      />
      
      {/* Botón para Venta Manual en Caja (Placeholder) */}
      <div className="manual-sale-section" style={{ marginTop: '30px', borderTop: '1px solid #ccc', paddingTop: '20px' }}>
         <h2>Venta Manual en Caja</h2>
         {/* --- INICIO CAMBIO BOTÓN --- */}
         <button 
           onClick={() => setIsCajaModalOpen(true)} // Abre el modal
           className="manual-sale-button"
         >
           Registrar Venta Manual
         </button>
         {/* --- FIN CAMBIO BOTÓN --- */}
       </div>

       {/* --- INICIO RENDERIZADO MODAL --- */}
       {/* Renderiza el Modal si isCajaModalOpen es true */}
       <Modal isOpen={isCajaModalOpen} onClose={() => setIsCajaModalOpen(false)}>
          <CajaSaleForm 
             onClose={() => setIsCajaModalOpen(false)} // Pasa la función para cerrar
             onSaleCreated={handleCajaSaleCreated} // Pasa la función a llamar en éxito
          />
       </Modal>
       {/* --- FIN RENDERIZADO MODAL --- */}

    </div>
  );
};

export default AdminSales;