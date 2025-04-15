// src/pages/Admin.jsx
import React, { useState, useEffect, useCallback } from 'react';
import ProductService from '../api/productService';
import ProductForm from '../components/ProductForm';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import API from '../api/axios';

const Admin = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { isAdmin, loading: authLoading } = useAuth();

  const backendBaseUrl = API.defaults.baseURL || 'http://localhost:8000';
  const imageBaseUrl = `${backendBaseUrl}/static/product_images/`;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ProductService.getProducts();
      setProducts(data);
    } catch (err) {
      const errorDetail = err.response?.data?.detail || err.message || 'Error al cargar los productos';
      setError(errorDetail);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAdmin()) {
      fetchProducts();
    } else if (!authLoading && !isAdmin()) {
      setLoading(false);
    }
  }, [authLoading, isAdmin, fetchProducts]);

  if (authLoading) {
    return <p>Verificando acceso...</p>;
  }
  if (!isAdmin()) {
    return <Navigate to="/products" />;
  }

  const handleNewProduct = () => {
    setEditingProduct(null);
    setError(null);
    setShowForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setError(null);
    setShowForm(true);
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      setError(null);
      // Podrías añadir un estado de loading específico para el borrado si quieres
      try {
        await ProductService.deleteProduct(id);
        setProducts(currentProducts => currentProducts.filter(p => p.id !== id));
      } catch (err) {
        const errorDetail = err.response?.data?.detail || err.message || 'Error al eliminar el producto';
        setError(errorDetail);
      }
    }
  };

  const handleSaveProduct = () => {
    setShowForm(false);
    setEditingProduct(null);
    fetchProducts();
  };

  if (loading && products.length === 0) return <p>Cargando productos...</p>; // Mostrar solo si no hay datos aún

  return (
    <div className="admin-page">
      <h1>Panel de Administración - Productos</h1>
      {error && <p className="error admin-error">{error}</p>}

      {!showForm && (
        <div className="admin-controls" style={{ marginBottom: '20px' }}>
          <button onClick={handleNewProduct}>Crear Nuevo Producto</button>
        </div>
      )}

      {showForm ? (
        <ProductForm
          product={editingProduct}
          onSave={handleSaveProduct}
          onCancel={() => { setShowForm(false); setEditingProduct(null); }}
        />
      ) : (
        <div className="product-admin-list">
          <h2>Gestión de Productos</h2>
          {products.length === 0 && !loading && <p>No hay productos cargados.</p>}
          {products.length > 0 && (
             <table className="admin-table">
              <thead>
                <tr>
                  <th>Foto</th>
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
                {products.map(product => {
                  const isLowStock = product.stock <= product.stockMinimo;
                  // Usa la clase CSS en lugar de style en línea
                  const rowClassName = isLowStock ? 'low-stock-warning' : '';

                  return (
                    <tr key={product.id} className={rowClassName}>
                      {/* Añade data-label a cada td */}
                      <td data-label="Foto">
                        {product.foto ? (
                          <img
                            src={`${imageBaseUrl}${product.foto}`}
                            alt={product.nombre}
                            // onError manejado por CSS si es necesario
                          />
                        ) : (
                          <span className="no-photo">Sin foto</span>
                        )}
                      </td>
                      <td data-label="ID">{product.id}</td>
                      <td data-label="Nombre">
                        {product.nombre}
                        {isLowStock && (
                          <span className="low-stock-message">
                            ¡Reponer stock!
                          </span>
                        )}
                      </td>
                      <td data-label="Precio">${product.precioActual?.toFixed(2)}</td>
                      <td data-label="Stock">{product.stock}</td>
                      <td data-label="Stock Mínimo">{product.stockMinimo}</td>
                      <td data-label="Visible">{product.mostrarEnSistema ? 'Sí' : 'No'}</td>
                      <td data-label="Acciones" className="actions">
                        <button onClick={() => handleEditProduct(product)} className="action-button-small">Editar</button>
                        <button className="delete action-button-small" onClick={() => handleDeleteProduct(product.id)}>Eliminar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
           )}
        </div>
      )}
    </div>
  );
};

export default Admin;