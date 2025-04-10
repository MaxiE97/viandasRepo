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
            {/* COLUMNA MODIFICADA/AÑADIDA */}
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
              <td>{sale.id}</td>
              <td>{sale.user?.name || 'N/A'}</td> {/* Muestra nombre o N/A */}
              <td>{sale.user?.email || 'N/A'}</td> {/* Muestra email o N/A */}
              {/* CELDA PARA MOSTRAR PRODUCTOS Y CANTIDADES */}
              <td>
                {sale.line_of_sales && sale.line_of_sales.length > 0 ? (
                  <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
                    {sale.line_of_sales.map(line => (
                      // Usar line.id o line.product.id si es más estable como key
                      <li key={line.id || line.product?.id || Math.random()}> {/* Añadir key único */}
                        {line.product?.nombre || 'Producto Desconocido'} ({line.cantidad}x)
                      </li>
                    ))}
                  </ul>
                ) : (
                  'No hay productos'
                )}
              </td>
              {/* FIN CELDA PRODUCTOS */}
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
               {/* Formatear la fecha para mejor legibilidad */}
               <td>{new Date(sale.date).toLocaleDateString()}</td>
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
    // No reiniciar loading si ya hay datos, para evitar parpadeo
    if (pedidosSolicitados.length === 0 && pendientesRetiro.length === 0 && ventasFinalizadas.length === 0) {
        setLoading(true);
    }
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
      // Mantener datos viejos si falla la recarga? O limpiar? Limpiemos por ahora.
      setPedidosSolicitados([]);
      setPendientesRetiro([]);
      setVentasFinalizadas([]);
    } finally {
      setLoading(false);
    }
  }, [pedidosSolicitados.length, pendientesRetiro.length, ventasFinalizadas.length]); // Dependencias para la condición de loading

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchData();
  }, [fetchData]); // fetchData ahora tiene dependencias, así que se incluye

  // --- Manejadores de Acciones ---
  const handleAction = async (actionPromise, successMessage) => {
     // Indicador visual de carga más específico podría ser útil aquí
     // setLoading(true); // Podrías tener loadings más específicos por tabla/acción
     setError(null);
     try {
       await actionPromise;
       console.log(successMessage); // O mostrar un toast/notificación
       // Podrías añadir un breve delay antes de recargar para que el usuario vea la acción
       // setTimeout(fetchData, 500);
       await fetchData(); // Recargar datos después de la acción
     } catch (err) {
       const errorDetail = err.response?.data?.detail || err.message || 'Ocurrió un error al realizar la acción.';
       setError(errorDetail);
     } finally {
        // setLoading(false); // Lo maneja fetchData al final
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
     handleAction(registerSaleInCaja(saleId), `Pedido ${saleId} registrado en caja.`);
  };

    // --- Función para manejar el éxito de creación de venta en caja ---
    const handleCajaSaleCreated = () => {
      console.log("Venta en caja creada exitosamente.");
      setIsCajaModalOpen(false); // Cierra el modal
      fetchData(); // Recarga todas las listas (la nueva venta aparecerá en 'Ventas Finalizadas')
   };

  // --- Renderizado ---
  // Muestra 'Cargando...' solo la primera vez o si todo está vacío y está cargando
  if (loading && pedidosSolicitados.length === 0 && pendientesRetiro.length === 0 && ventasFinalizadas.length === 0) {
    return <p>Cargando pedidos y ventas...</p>;
 }


  return (
    <div className="admin-sales-page">
      <h1>Gestión de Pedidos y Ventas</h1>
      {/* Mensaje de error más visible */}
      {error && (
         <p className="error" style={{ 
              backgroundColor: '#f8d7da', 
              color: '#721c24', 
              border: '1px solid #f5c6cb', 
              padding: '10px 15px', 
              marginBottom: '15px', 
              borderRadius: '4px' 
            }}>
           Error: {error}
         </p>
       )}

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
          // No hay acciones activas en esta tabla (podría haber "Ver Detalles" en el futuro)
           canTogglePaid: false, // No permitir cambiar pagado aquí
        }}
      />

      {/* Botón para Venta Manual en Caja */}
      <div className="manual-sale-section" style={{ marginTop: '30px', borderTop: '1px solid #ccc', paddingTop: '20px' }}>
         <h2>Venta Manual en Caja</h2>
         <button
           onClick={() => setIsCajaModalOpen(true)} // Abre el modal
           className="manual-sale-button"
         >
           Registrar Venta Manual
         </button>
       </div>

       {/* Renderizado Modal */}
       <Modal isOpen={isCajaModalOpen} onClose={() => setIsCajaModalOpen(false)}>
          <CajaSaleForm
             onClose={() => setIsCajaModalOpen(false)} // Pasa la función para cerrar
             onSaleCreated={handleCajaSaleCreated} // Pasa la función a llamar en éxito
          />
       </Modal>

    </div>
  );
};

export default AdminSales;