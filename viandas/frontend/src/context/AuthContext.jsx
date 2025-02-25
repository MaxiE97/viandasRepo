// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../api/axios';

// Crear el contexto
const AuthContext = createContext();

// Hook personalizado para usar el contexto
export const useAuth = () => useContext(AuthContext);

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Comprobar si hay un token al cargar la aplicación
  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Puedes crear un endpoint en tu API para validar el token
          // y obtener información del usuario actual
          const response = await API.get('/users/me');
          setUser(response.data);
        } catch (err) {
          localStorage.removeItem('token');
          setError('Sesión expirada o inválida');
        }
      }
      setLoading(false);
    };

    checkToken();
  }, []);

  // Función para iniciar sesión
  const login = async (email, password) => {
    try {
      const response = await API.post('/auth/token', new URLSearchParams({
        username: email,
        password: password
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      
      // Obtener datos del usuario
      const userResponse = await API.get('/users/me');
      setUser(userResponse.data);
      
      return true;
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al iniciar sesión');
      return false;
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Función para verificar si el usuario es administrador
  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  // Valores que estarán disponibles en el contexto
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};