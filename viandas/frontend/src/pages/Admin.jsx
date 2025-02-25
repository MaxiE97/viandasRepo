// src/pages/Admin.jsx
import React, { useState, useEffect } from 'react';
import ProductService from '../api/productService';
import ProductForm from '../components/ProductForm';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const Admin = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { isAdmin } = useAuth();

  // Verificar si el usuario es administrador
  if (!isAdmin()) {
    return <Navigate to="/products" />;
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await ProductService.getProducts();
      setProducts(data);
      setLoading(false);
    } catch (err) {
      setError('Error al cargar los productos');
      setLoading(false);
    }
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await ProductService.deleteProduct(id);
        fetchProducts(); // Recargar la lista después de eliminar
      } catch (err) {
        setError('Error al eliminar el producto');
      }
    }
  };

  const handleSaveProduct = () => {
    setShowForm(false);
    fetchProducts(); // Recargar la lista después de guardar
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="admin-page">
      <h1>Panel de Administración - Productos</h1>
      {error && <p className="error">{error}</p>}
      
      <div className="admin-controls">
        <button onClick={handleNewProduct}>Crear Nuevo Producto</button>
      </div>
      
      {showForm ? (
        <ProductForm 
          product={editingProduct} 
          onSave={handleSaveProduct}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <div className="product-admin-list">
          <h2>Gestión de Productos</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Stock Mínimo</th>
                <th>Visible</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.nombre}</td>
                  <td>${product.precioActual}</td>
                  <td>{product.stock}</td>
                  <td>{product.stockMinimo}</td>
                  <td>{product.mostrarEnSistema ? 'Sí' : 'No'}</td>
                  <td className="actions">
                    <button onClick={() => handleEditProduct(product)}>Editar</button>
                    <button 
                      className="delete" 
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Admin;