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

  // No mostrar navbar si no hay usuario
  if (!user) {
     return null; 
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        {/* El enlace principal lleva a /admin si es admin, sino a /products */}
        <Link to={isAdmin() ? "/admin" : "/products"}>Sistema de Viandas</Link>
      </div>
      
      <ul className="navbar-nav">
         {/* --- VISTA CLIENTE --- */}
        {!isAdmin() && (
          <>
            <li className="nav-item">
              <Link to="/products">Productos</Link>
            </li>
            <li className="nav-item">
              <Link to="/profile">Mi Perfil</Link> 
            </li>
             {/* Puedes añadir aquí link a "Mis Pedidos" para clientes en el futuro */}
          </>
        )}

        {/* --- VISTA ADMIN --- */}
        {isAdmin() && (
          <>
            <li className="nav-item admin">
              <Link to="/admin">Admin Productos</Link> {/* Ahora es la vista principal de productos para admin */}
            </li>
            <li className="nav-item admin">
              <Link to="/admin/sales">Admin Ventas</Link> 
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