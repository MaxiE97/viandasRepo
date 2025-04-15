// src/components/Navbar.jsx
import React from 'react';
// ¡Importa NavLink en lugar de Link!
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // No mostrar navbar si no hay usuario
  if (!user) {
     return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        {/* Usa NavLink aquí también si quieres que sea "activo" */}
        <NavLink to={isAdmin() ? "/admin" : "/products"}>Sistema de Viandas</NavLink>
      </div>

      <ul className="navbar-nav">
         {/* --- VISTA CLIENTE --- */}
        {!isAdmin() && (
          <>
            <li className="nav-item">
              {/* Usa NavLink */}
              <NavLink to="/products">Productos</NavLink>
            </li>
            <li className="nav-item">
               {/* Usa NavLink */}
              <NavLink to="/profile">Mi Perfil</NavLink>
            </li>
             {/* Puedes añadir aquí link a "Mis Pedidos" para clientes en el futuro */}
          </>
        )}

        {/* --- VISTA ADMIN --- */}
        {isAdmin() && (
          <>
            <li className="nav-item admin">
               {/* Usa NavLink */}
              <NavLink to="/admin">Admin Productos</NavLink>
            </li>
            <li className="nav-item admin">
               {/* Usa NavLink */}
              <NavLink to="/admin/sales">Admin Ventas</NavLink>
            </li>
             {/* Puedes añadir aquí links a "Usuarios", "Reportes", etc. para admin */}
          </>
        )}
      </ul>

      <div className="navbar-user">
        <span>Hola, {user.name || user.email}</span>
        <button onClick={handleLogout}>Cerrar Sesión</button>
      </div>
    </nav>
  );
};

export default Navbar;