// src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // No mostrar navbar si no hay usuario o mientras carga (si tuvieras estado de loading)
  if (!user) {
     // Podrías retornar un loader o null. Null es más simple si no hay usuario.
     // Si tienes un estado 'loading' en useAuth, podrías usar: if (loading) return <p>Cargando...</p>; if (!user) return null;
     return null; 
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        {/* El enlace principal podría llevar a /products si está logueado, o /admin si es admin */}
        <Link to={isAdmin() ? "/admin" : "/products"}>Sistema de Viandas</Link>
      </div>
      <ul className="navbar-nav">
        {/* Enlace a Productos (Visible para todos los logueados) */}
        <li className="nav-item">
          <Link to="/products">Productos</Link>
        </li>

        {/* Enlace a Mi Perfil (Visible solo para NO Admins) */}
        {!isAdmin() && (
          <li className="nav-item">
            <Link to="/profile">Mi Perfil</Link> 
          </li>
        )}

        {/* --- INICIO SECCIÓN ADMIN --- */}
        {/* Enlaces solo visibles para Admins */}
        {isAdmin() && (
          <> {/* Usamos un Fragment para agrupar los enlaces de admin */}
            <li className="nav-item admin">
              <Link to="/admin">Admin Productos</Link>
            </li>
            {/* Nuevo enlace a Admin Ventas */}
            <li className="nav-item admin">
              <Link to="/admin/sales">Admin Ventas</Link> 
            </li>
          </>
        )}
        {/* --- FIN SECCIÓN ADMIN --- */}
      </ul>
      
      {/* Sección Usuario y Logout (Visible para todos los logueados) */}
      <div className="navbar-user">
         {/* Asegúrate que user.name exista, si no usa email como fallback */}
        <span>Hola, {user.name || user.email}</span> 
        <button onClick={handleLogout}>Cerrar Sesión</button>
      </div>
    </nav>
  );
};

export default Navbar;