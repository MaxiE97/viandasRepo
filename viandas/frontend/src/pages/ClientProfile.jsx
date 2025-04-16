// src/pages/ClientProfile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUserCellphone } from '../api/userService';
import { getMyReadyOrders } from '../api/saleService';

const ClientProfile = () => {
  const { user } = useAuth();
  const [newCellphone, setNewCellphone] = useState('');
  const [loadingCellphone, setLoadingCellphone] = useState(false);
  const [errorCellphone, setErrorCellphone] = useState('');
  const [successCellphone, setSuccessCellphone] = useState('');
  const [readyOrders, setReadyOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [errorOrders, setErrorOrders] = useState('');

  // Función para formatear fecha YYYY-MM-DD a DD/MM/YYYY local
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    // Crea la fecha usando los componentes para evitar problemas de UTC
    const localDate = new Date(parts[0], parts[1] - 1, parts[2]);
    // Comprueba si la fecha es válida antes de formatear
    if (isNaN(localDate.getTime())) {
        return dateString; // Devuelve el string original si la fecha no es válida
    }
    return localDate.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }); // Formato DD/MM/YYYY para Argentina
  };

  useEffect(() => {
    if (user) {
      setNewCellphone(user.celular || '');
    }
  }, [user]);

  useEffect(() => {
    const fetchReadyOrders = async () => {
      setLoadingOrders(true);
      setErrorOrders('');
      try {
        const orders = await getMyReadyOrders();
        setReadyOrders(orders);
      } catch (error) {
        console.error("Error fetching ready orders on profile:", error);
        setErrorOrders('No se pudieron cargar los pedidos listos.');
        setReadyOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    };
    if (user) { fetchReadyOrders(); } else { setLoadingOrders(false); }
  }, [user]);

  const handleCellphoneUpdate = async (e) => {
    e.preventDefault();
    if (!newCellphone || newCellphone === user.celular) {
       setErrorCellphone('Ingresa un celular diferente al actual.');
       setTimeout(() => setErrorCellphone(''), 5000);
       return;
    }
    setLoadingCellphone(true);
    setErrorCellphone('');
    setSuccessCellphone('');
    try {
      await updateUserCellphone(newCellphone);
      setSuccessCellphone('¡Celular actualizado con éxito!');
      // Considera refrescar los datos del usuario en el contexto si es necesario
      setTimeout(() => setSuccessCellphone(''), 5000);
    } catch (error) {
      setErrorCellphone(error.detail || error.message || 'Error al actualizar el celular.');
      setTimeout(() => setErrorCellphone(''), 5000);
    } finally {
      setLoadingCellphone(false);
    }
  };

  if (!user) {
    return <div>Debes iniciar sesión para ver tu perfil.</div>;
  }

  return (
    <div className="client-profile-page">
      <h1>Mi Perfil</h1>

      <div className="profile-section ready-orders-section">
        <h2>Pedidos Listos para Retirar</h2>
        {loadingOrders ? ( <p>Verificando pedidos...</p> )
         : errorOrders ? ( <p className="error">{errorOrders}</p> )
         : readyOrders.length > 0 ? (
            <div>
              <p className="success-message" style={{ textAlign: 'center', fontWeight: 'bold' }}>
                ¡Tienes {readyOrders.length} pedido(s) listo(s) para retirar!
              </p>
              <ul className="ready-orders-list">
                {readyOrders.map(order => (
                  <li key={order.id}>
                    {/* --- CAMBIO: Usar formatDate --- */}
                    <strong>Pedido del {formatDate(order.date)}:</strong>
                    {/* ---------------------------- */}
                    {order.line_of_sales && order.line_of_sales.length > 0 ? (
                       <ul style={{ paddingLeft: '1rem', marginTop: '0.3rem', fontSize: '0.9em' }}>
                        {order.line_of_sales.map(line => (
                          <li key={line.id} style={{ border: 'none', padding: '0.1rem 0', marginBottom: 0, background: 'none'}}>
                            {line.product?.nombre || 'Producto desconocido'} ({line.cantidad}x)
                          </li>
                        ))}
                      </ul>
                    ) : ( <span> (Sin detalles de productos)</span> )}
                  </li>
                ))}
              </ul>
            </div>
          ) : ( <p>No tienes pedidos listos para retirar en este momento.</p> )}
      </div>

      <div className="profile-section">
        <h2>Actualizar Celular</h2>
        <form onSubmit={handleCellphoneUpdate} className="profile-form">
           <div className="form-group">
              <label htmlFor="cellphone">Celular Actual:</label>
              <p>{user.celular || 'No especificado'}</p>
            </div>
            <div className="form-group">
              <label htmlFor="newCellphone">Nuevo Celular:</label>
              <input
                type="tel"
                id="newCellphone"
                value={newCellphone}
                onChange={(e) => { setNewCellphone(e.target.value); setErrorCellphone(''); setSuccessCellphone(''); }}
                placeholder="Ingresa tu nuevo número"
                disabled={loadingCellphone}
              />
            </div>
            {errorCellphone && <p className="error-message">{errorCellphone}</p>}
            {successCellphone && <p className="success-message">{successCellphone}</p>}
            <div className="buttons-container" style={{ borderTop: 'none', paddingTop: 0 }}>
              <button type="submit" disabled={loadingCellphone || !newCellphone || newCellphone === user.celular}>
                {loadingCellphone ? 'Actualizando...' : 'Actualizar Celular'}
              </button>
            </div>
        </form>
      </div>


    </div>
  );
};

export default ClientProfile;