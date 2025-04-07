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

  if (!user) return null; // No mostrar navbar si no hay usuario

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Sistema de Viandas</Link>
      </div>
      <ul className="navbar-nav">
        <li className="nav-item">
          <Link to="/products">Productos</Link>
        </li>

        {!isAdmin() && (
          <li className="nav-item">
            <Link to="/profile">Mi Perfil</Link> 
          </li>
        )}

        {isAdmin() && (
          <li className="nav-item admin">
            <Link to="/admin">Admin</Link>
          </li>
        )}
      </ul>
      <div className="navbar-user">
        <span>Hola, {user.name}</span>
        <button onClick={handleLogout}>Cerrar Sesión</button>
      </div>
    </nav>
  );
};

export default Navbar;