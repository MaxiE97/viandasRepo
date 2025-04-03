// src/pages/Products.jsx
import React, { useState } from 'react';
import ProductList from '../components/ProductList';
import ProductForm from '../components/ProductForm';
import OrderForm from '../components/OrderForm';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const Products = () => {
  const [showForm, setShowForm] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
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

  const handleOrderPlaced = () => {
    setOrderSuccess(true);
    // Limpiar mensaje de éxito después de unos segundos
    setTimeout(() => {
      setOrderSuccess(false);
    }, 5000);
  };

  return (
    <div className="products-page">
      <h1>Gestión de Productos</h1>
      
      <div className="product-actions">
        {isAdmin() && (
          <div className="admin-controls">
            <button onClick={handleNewProduct}>Nuevo Producto</button>
          </div>
        )}
        
        <div className="user-controls">
          <button 
            onClick={() => setShowOrderModal(true)}
            className="order-button"
          >
            Realizar Pedido
          </button>
        </div>
      </div>

      {orderSuccess && (
        <div className="success-message">
          ¡Tu pedido ha sido realizado con éxito!
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

      {/* Modal para realizar pedidos */}
      <Modal 
        isOpen={showOrderModal} 
        onClose={() => setShowOrderModal(false)}
      >
        <OrderForm 
          onClose={() => setShowOrderModal(false)}
          onOrderPlaced={handleOrderPlaced}
        />
      </Modal>
    </div>
  );
};

export default Products;