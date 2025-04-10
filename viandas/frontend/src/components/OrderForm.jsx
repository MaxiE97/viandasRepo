// src/components/OrderForm.jsx
import React, { useState, useEffect } from 'react';
import ProductService from '../api/productService';
import { createOnlineSale } from '../api/saleService';

const OrderForm = ({ onClose, onOrderPlaced }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [observations, setObservations] = useState({});
  const [generalObservation, setGeneralObservation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Cargar productos al iniciar
    const fetchProducts = async () => {
      try {
        const data = await ProductService.getProducts();
        // Inicializar productos con cantidad 1 y checkbox desmarcado
        const productList = data.map(product => ({
          ...product,
          selected: false,
          quantity: 1
        }));
        setProducts(productList);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los productos');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Manejar cambios en el checkbox de selección
  const handleProductSelection = (productId) => {
    const updatedProducts = products.map(product => {
      if (product.id === productId) {
        return { ...product, selected: !product.selected };
      }
      return product;
    });
    setProducts(updatedProducts);
  };

  // Manejar cambios en la cantidad
  const handleQuantityChange = (productId, quantity) => {
    if (quantity < 1) quantity = 1; // Asegurar que la cantidad sea al menos 1
    
    const updatedProducts = products.map(product => {
      if (product.id === productId) {
        return { ...product, quantity: quantity };
      }
      return product;
    });
    setProducts(updatedProducts);
  };

  // Manejar cambios en las observaciones por producto
  const handleObservationChange = (productId, observation) => {
    setObservations({
      ...observations,
      [productId]: observation
    });
  };

  // Enviar el pedido
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Filtrar productos seleccionados
      const selectedItems = products.filter(product => product.selected);
      
      if (selectedItems.length === 0) {
        throw new Error('Debes seleccionar al menos un producto');
      }

      // Preparar observaciones concatenadas
      let allObservations = generalObservation || '';
      
      // Añadir observaciones específicas de cada producto si existen
      selectedItems.forEach(product => {
        const productObs = observations[product.id];
        if (productObs && productObs.trim() !== '') {
          allObservations += `\n[${product.nombre}]: ${productObs}`;
        }
      });

      // Crear estructura para enviar al API
      const saleData = {
        observation: allObservations.trim(),
        line_of_sales: selectedItems.map(product => ({
          cantidad: product.quantity,
          product_id: product.id
        }))
      };

      // Enviar al API
      await createOnlineSale(saleData);
      
      setSubmitting(false);
      if (onOrderPlaced) onOrderPlaced();
      if (onClose) onClose();
    } catch (err) {
      setSubmitting(false);
      console.error("Error detallado:", err.response?.data); // Añade esto
      setError(err.message || 'Error al realizar el pedido');
    }
  };

  if (loading) return <div className="loading">Cargando productos...</div>;

  return (
    <div className="order-form">
      <h2>Realizar Pedido</h2>
      {error && <p className="error">{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <div className="product-selection">
          <table className="product-table">
            <thead>
              <tr>
                <th>Seleccionar</th>
                <th>Producto</th>
                <th>Precio</th>
                <th>Cantidad</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>
                    <input 
                      type="checkbox"
                      checked={product.selected || false}
                      onChange={() => handleProductSelection(product.id)}
                    />
                  </td>
                  <td>{product.nombre}</td>
                  <td>${product.precioActual}</td>
                  <td>
                    <input 
                      type="number"
                      min="1"
                      value={product.quantity || 1}
                      onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value))}
                      disabled={!product.selected}
                    />
                  </td>
                  <td>
                    <input 
                      type="text"
                      placeholder="Observación específica"
                      value={observations[product.id] || ''}
                      onChange={(e) => handleObservationChange(product.id, e.target.value)}
                      disabled={!product.selected}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="form-group">
          <label htmlFor="generalObservation">Observación General:</label>
          <textarea
            id="generalObservation"
            value={generalObservation}
            onChange={(e) => setGeneralObservation(e.target.value)}
            placeholder="Observaciones generales para todo el pedido"
          />
        </div>

        <div className="buttons-container">
          <button type="button" onClick={onClose} className="cancel-button">
            Cancelar
          </button>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Enviando...' : 'Confirmar Pedido'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;