// src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/userService'; 


const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    apellido: '',
    celular: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validaciones básicas
      if (!formData.email || !formData.password || !formData.name) {
        throw new Error('Por favor completa todos los campos obligatorios');
      }

      // Intentar registrar al usuario
      await register(formData);
      setLoading(false);
      
      // Redirigir a la página de login con mensaje de éxito
      navigate('/login', { 
        state: { message: 'Registro exitoso. Por favor inicia sesión.' } 
      });
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data) {
        setError(err.response.data.detail || 'Error al registrar usuario');
      } else {
        setError(err.message || 'Error al registrar usuario');
      }
    }
  };

  return (
    <div className="login-container">
      <h2>Registrar Nuevo Cliente</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email*:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Contraseña*:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="name">Nombre*:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="apellido">Apellido:</label>
          <input
            type="text"
            id="apellido"
            name="apellido"
            value={formData.apellido}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="celular">Número de Celular:</label>
          <input
            type="tel"
            id="celular"
            name="celular"
            value={formData.celular}
            onChange={handleChange}
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>
      
      <div className="register-login-link" style={{ marginTop: '20px', textAlign: 'center' }}>
        ¿Ya tienes una cuenta? <Link to="/login">Iniciar Sesión</Link>
      </div>
    </div>
  );
};

export default Register;