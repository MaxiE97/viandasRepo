// src/pages/Admin.jsx
import React, { useState, useEffect, useCallback } from 'react';
import ProductService from '../api/productService';
import ProductForm from '../components/ProductForm';
// import ProductList from '../components/ProductList'; // Ya no se usa aquí
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import API from '../api/axios'; // Necesario para la URL de imagen en la tabla admin

const Admin = () => {
  // --- HOOKS ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { isAdmin, loading: authLoading } = useAuth(); // 'user' no era usado, lo quitamos

  // URL base para imágenes
  const backendBaseUrl = API.defaults.baseURL || 'http://localhost:8000';
  const imageBaseUrl = `${backendBaseUrl}/static/product_images/`;

  // Función para cargar productos
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

  // useEffect para la carga inicial
  useEffect(() => {
    if (!authLoading && isAdmin()) {
      fetchProducts();
    } else if (!authLoading && !isAdmin()) {
      setLoading(false); // Asegurar que loading termine si no es admin
    }
  }, [authLoading, isAdmin, fetchProducts]);

  // --- VERIFICACIONES ---
  if (authLoading) {
    return <p>Verificando acceso...</p>;
  }
  if (!isAdmin()) {
    return <Navigate to="/products" />;
  }

  // --- Handlers ---
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

  // Reimplementamos handleDeleteProduct aquí
  const handleDeleteProduct = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      setError(null);
      try {
        await ProductService.deleteProduct(id);
        // Actualizar la lista localmente O recargar
        setProducts(currentProducts => currentProducts.filter(p => p.id !== id));
        // Opcional: podrías llamar a fetchProducts() para asegurar sincronización total
        // fetchProducts(); 
      } catch (err) {
        const errorDetail = err.response?.data?.detail || err.message || 'Error al eliminar el producto';
        setError(errorDetail);
      }
    }
  };

  const handleSaveProduct = () => {
    setShowForm(false);
    setEditingProduct(null);
    fetchProducts(); // Recargar lista después de guardar/actualizar
  };

  if (loading) return <p>Cargando productos...</p>;

  return (
    <div className="admin-page">
      <h1>Panel de Administración - Productos</h1>
      {error && <p className="error admin-error">{error}</p>} {/* Clase específica para errores de admin */}

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
        // --- Tabla de Admin Mejorada ---
        <div className="product-admin-list">
          <h2>Gestión de Productos</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Foto</th>
                <th>ID</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Stock Mínimo</th> {/* Nueva Columna */}
                <th>Visible</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => {
                const isLowStock = product.stock <= product.stockMinimo;
                const rowStyle = isLowStock ? { backgroundColor: 'rgba(255, 215, 0, 0.3)' } : {}; // Amarillo suave para bajo stock

                return (
                  <tr key={product.id} style={rowStyle}>
                    <td> {/* Celda de Foto */}
                      {product.foto ? (
                        <img 
                          src={`${imageBaseUrl}${product.foto}`} 
                          alt={product.nombre} 
                          style={{ width: '50px', height: '50px', objectFit: 'cover', border: '1px solid #ccc' }} 
                          onError={(e) => { e.target.style.display = 'none'; }} 
                        />
                      ) : (
                        <span style={{fontSize: '10px', color: '#888'}}>Sin foto</span>
                      )}
                    </td>
                    <td>{product.id}</td>
                    <td>
                      {product.nombre}
                      {/* Advertencia de bajo stock */}
                      {isLowStock && (
                        <span style={{ 
                            display: 'block', 
                            fontSize: '11px', 
                            color: '#e67e22', // Naranja oscuro
                            fontWeight: 'bold' 
                        }}>
                          ¡Reponer stock!
                        </span>
                      )}
                    </td>
                    <td>${product.precioActual?.toFixed(2)}</td>
                    <td>{product.stock}</td>
                    <td>{product.stockMinimo}</td> {/* Mostrar Stock Mínimo */}
                    <td>{product.mostrarEnSistema ? 'Sí' : 'No'}</td>
                    <td className="actions">
                      <button onClick={() => handleEditProduct(product)} style={{ marginRight: '5px' }}>Editar</button>
                      {/* Botón eliminar llama al handler local */}
                      <button className="delete" onClick={() => handleDeleteProduct(product.id)}>Eliminar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        // --- Fin Tabla Admin ---
      )}
    </div>
  );
};

export default Admin;