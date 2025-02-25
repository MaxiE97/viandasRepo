// src/pages/Products.jsx
import React, { useState } from 'react';
import ProductList from '../components/ProductList';
import ProductForm from '../components/ProductForm';
import { useAuth } from '../context/AuthContext';

const Products = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { isAdmin } = useAuth();

  const handleNewProduct = () => {
    setSelectedProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowForm(true);
  };

  const handleSaveProduct = () => {
    setShowForm(false);
    // Aquí podrías recargar la lista de productos
    window.location.reload();
  };

  return (
    <div className="products-page">
      <h1>Gestión de Productos</h1>
      {isAdmin() && (
        <div className="admin-controls">
          <button onClick={handleNewProduct}>Nuevo Producto</button>
        </div>
      )}

      {showForm ? (
        <ProductForm 
          product={selectedProduct} 
          onSave={handleSaveProduct}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <ProductList onEditProduct={handleEditProduct} />
      )}
    </div>
  );
};

export default Products;