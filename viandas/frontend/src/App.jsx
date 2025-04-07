// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';  // Importamos la nueva página de registro
import Products from './pages/Products';
import Navbar from './components/Navbar';
import Admin from './pages/Admin'; 
import ClientProfile from './pages/ClientProfile';
import './App.css';

// Componente de ruta protegida
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Componente de ruta para administradores
const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  if (!user || !isAdmin()) {
    return <Navigate to="/products" />;
  }
  
  return children;
};

function AppContent() {
  return (
    <Router>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} /> {/* Nueva ruta para registro */}
          <Route path="/products" element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <AdminRoute> 
              <Admin /> 
            </AdminRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute> 
              <ClientProfile /> 
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/products" />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;