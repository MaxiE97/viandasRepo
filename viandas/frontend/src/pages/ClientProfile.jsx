// src/pages/ClientProfile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUserEmail, updateUserCellphone } from '../api/userService'; // Importa las nuevas funciones

const ClientProfile = () => {
  const { user, refreshAuthToken } = useAuth(); // Obtén el usuario y la función para refrescar datos si es necesario

  // Estados para los formularios y mensajes
  const [newEmail, setNewEmail] = useState('');
  const [newCellphone, setNewCellphone] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingCellphone, setLoadingCellphone] = useState(false);
  const [errorEmail, setErrorEmail] = useState('');
  const [errorCellphone, setErrorCellphone] = useState('');
  const [successEmail, setSuccessEmail] = useState('');
  const [successCellphone, setSuccessCellphone] = useState('');

  // Cargar datos iniciales del usuario en los inputs
  useEffect(() => {
    if (user) {
      setNewEmail(user.email || '');
      setNewCellphone(user.celular || '');
    }
  }, [user]); // Se ejecuta cuando el componente monta o 'user' cambia

  // Manejador para actualizar el email
  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    if (!newEmail || newEmail === user.email) {
      setErrorEmail('Ingresa un email diferente al actual.');
      return;
    }
    setLoadingEmail(true);
    setErrorEmail('');
    setSuccessEmail('');
    try {
      await updateUserEmail(newEmail);
      setSuccessEmail('¡Email actualizado con éxito!');
      // Opcional: Refrescar el token/datos de usuario en el contexto si es necesario
      if (refreshAuthToken) {
         await refreshAuthToken(); // Llama a la función para obtener datos actualizados si existe
      }
      // Limpiar mensaje después de unos segundos
       setTimeout(() => setSuccessEmail(''), 5000);
    } catch (error) {
      setErrorEmail(error.detail || error.message || 'Error al actualizar el email.');
       setTimeout(() => setErrorEmail(''), 5000);
    } finally {
      setLoadingEmail(false);
    }
  };

  // Manejador para actualizar el celular
  const handleCellphoneUpdate = async (e) => {
    e.preventDefault();
    if (!newCellphone || newCellphone === user.celular) {
       setErrorCellphone('Ingresa un celular diferente al actual.');
      return;
    }
    setLoadingCellphone(true);
    setErrorCellphone('');
    setSuccessCellphone('');
    try {
      await updateUserCellphone(newCellphone);
      setSuccessCellphone('¡Celular actualizado con éxito!');
       // Opcional: Refrescar el token/datos de usuario en el contexto si es necesario
      if (refreshAuthToken) {
         await refreshAuthToken(); // Llama a la función para obtener datos actualizados si existe
      }
      // Limpiar mensaje después de unos segundos
       setTimeout(() => setSuccessCellphone(''), 5000);
    } catch (error) {
      setErrorCellphone(error.detail || error.message || 'Error al actualizar el celular.');
      setTimeout(() => setErrorCellphone(''), 5000);
    } finally {
      setLoadingCellphone(false);
    }
  };

  if (!user) {
    return <div>Cargando perfil...</div>; // O un spinner de carga
  }

  return (
    <div className="client-profile-page">
      <h1>Mi Perfil</h1>
      
      {/* Sección para actualizar Email */}
      <div className="profile-section">
        <h2>Datos de Contacto</h2>
        <form onSubmit={handleEmailUpdate} className="profile-form">
          <div className="form-group">
            <label htmlFor="email">Email Actual:</label>
            <p>{user.email}</p> {/* Muestra el email actual */}
          </div>
          <div className="form-group">
            <label htmlFor="newEmail">Nuevo Email:</label>
            <input
              type="email"
              id="newEmail"
              value={newEmail}
              onChange={(e) => { setNewEmail(e.target.value); setErrorEmail(''); setSuccessEmail(''); }}
              required
              disabled={loadingEmail}
            />
          </div>
          {errorEmail && <p className="error-message">{errorEmail}</p>}
          {successEmail && <p className="success-message">{successEmail}</p>}
          <button type="submit" disabled={loadingEmail || newEmail === user.email}>
            {loadingEmail ? 'Actualizando...' : 'Actualizar Email'}
          </button>
        </form>
      </div>

      {/* Sección para actualizar Celular */}
      <div className="profile-section">
         <form onSubmit={handleCellphoneUpdate} className="profile-form">
           <div className="form-group">
             <label htmlFor="cellphone">Celular Actual:</label>
             {/* Asume que el campo se llama 'celular' en tu objeto user */}
             <p>{user.celular || 'No especificado'}</p> 
           </div>
           <div className="form-group">
             <label htmlFor="newCellphone">Nuevo Celular:</label>
             <input
              type="tel" // Usar type="tel" para celulares
              id="newCellphone"
              value={newCellphone}
              onChange={(e) => { setNewCellphone(e.target.value); setErrorCellphone(''); setSuccessCellphone(''); }}
              required
              disabled={loadingCellphone}
             />
           </div>
           {errorCellphone && <p className="error-message">{errorCellphone}</p>}
           {successCellphone && <p className="success-message">{successCellphone}</p>}
           <button type="submit" disabled={loadingCellphone || newCellphone === user.celular}>
             {loadingCellphone ? 'Actualizando...' : 'Actualizar Celular'}
           </button>
         </form>
      </div>

      {/* Sección Futura para Estado de Pedidos */}
      <div className="profile-section">
        <h2>Mis Pedidos</h2>
        <p>Aquí podrás ver el estado de tus pedidos próximamente.</p>
        {/* Aquí iría la lógica para mostrar pedidos cuando la implementes */}
      </div>

    </div>
  );
};

export default ClientProfile;