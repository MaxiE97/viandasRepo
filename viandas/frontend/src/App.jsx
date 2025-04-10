// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products'; // Página para clientes
import Navbar from './components/Navbar';
import Admin from './pages/Admin'; // Página de admin productos
import ClientProfile from './pages/ClientProfile';
import AdminSales from './pages/AdminSales';
import './App.css';

// Ruta protegida general (solo necesita login)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

// Ruta específica para clientes (no admins)
const ClientRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/login" />;
  // Si es admin, redirige al panel de admin en lugar de la página de cliente
  if (isAdmin()) return <Navigate to="/admin" />; 
  return children;
};


// Ruta para administradores
const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div>Cargando...</div>;
  // Redirige si no está logueado O si no es admin
  if (!user || !isAdmin()) return <Navigate to="/products" />; 
  return children;
};

function AppContent() {
  return (
    <Router>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Ruta /products ahora es solo para clientes */}
          <Route 
            path="/products" 
            element={
              <ClientRoute> 
                <Products />
              </ClientRoute>
            } 
          />

          {/* Rutas de Admin */}
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/sales" 
            element={
              <AdminRoute>
                <AdminSales />
              </AdminRoute>
            } 
          />

          {/* Ruta de Perfil (asumimos que es para clientes) */}
          <Route 
            path="/profile" 
            element={
              <ClientRoute>
                 <ClientProfile /> 
              </ClientRoute>
             } 
           />

           {/* Redirección Raíz */}
           {/* Podríamos hacerla condicional también */}
          <Route path="/" element={<Navigate to="/products" />} /> 
          
           {/* Ruta Catch-all o Not Found (Opcional) */}
           {/* <Route path="*" element={<NotFound />} /> */}
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