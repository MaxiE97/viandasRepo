// src/components/OrderForm.jsx
import React, { useState, useEffect } from 'react';
import ProductService from '../api/productService';
import { createOnlineSale } from '../api/saleService';

const OrderForm = ({ onClose, onOrderPlaced }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Ya no necesitamos selectedProducts, manejamos con el estado de cada producto
  const [observations, setObservations] = useState({});
  const [generalObservation, setGeneralObservation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await ProductService.getProducts();
        // Filtrar y preparar productos disponibles para la venta
        const availableProducts = data
            .filter(p => p.mostrarEnSistema && p.stock > 0) // Solo visibles y con stock
            .map(product => ({
              ...product,
              selected: false,
              quantity: 1 // Inicializar cantidad en 1
            }));
        setProducts(availableProducts);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los productos disponibles');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleProductSelection = (productId) => {
    setProducts(currentProducts =>
      currentProducts.map(product =>
        product.id === productId ? { ...product, selected: !product.selected } : product
      )
    );
  };

  const handleQuantityChange = (productId, quantity) => {
     const product = products.find(p => p.id === productId);
     if (!product) return;

     // Validar cantidad: > 0 y <= stock disponible
     const newQuantity = Math.max(1, Math.min(quantity, product.stock));

     setProducts(currentProducts =>
      currentProducts.map(p =>
        p.id === productId ? { ...p, quantity: newQuantity } : p
      )
    );
  };

  const handleObservationChange = (productId, observation) => {
    setObservations({
      ...observations,
      [productId]: observation
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const selectedItems = products.filter(product => product.selected);

      if (selectedItems.length === 0) {
        throw new Error('Debes seleccionar al menos un producto');
      }

      let allObservations = generalObservation || '';
      selectedItems.forEach(product => {
        const productObs = observations[product.id];
        if (productObs && productObs.trim() !== '') {
          allObservations += `\n[${product.nombre}]: ${productObs}`;
        }
      });

      const saleData = {
        observation: allObservations.trim() || null, // Enviar null si está vacía
        line_of_sales: selectedItems.map(product => ({
          cantidad: product.quantity,
          product_id: product.id
        }))
      };

      await createOnlineSale(saleData);

      setSubmitting(false);
      if (onOrderPlaced) onOrderPlaced();
      if (onClose) onClose(); // Cerrar modal en éxito
    } catch (err) {
      setSubmitting(false);
      const errorMsg = err.response?.data?.detail || err.message || 'Error al realizar el pedido';
      console.error("Error detallado:", err.response?.data || err);
      setError(errorMsg);
    }
  };

  if (loading) return <div className="loading">Cargando productos...</div>;

  return (
    <div className="order-form">
      {/* El título h2 lo maneja el Modal */}
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="product-selection" style={{ maxHeight: '50vh', overflowY: 'auto', marginBottom: '1rem' }}>
          {products.length === 0 ? (
             <p>No hay productos disponibles para pedir en este momento.</p>
           ) : (
            <table className="product-table">
              <thead>
                <tr>
                  <th>Seleccionar</th>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Disponibles</th>
                  <th>Cantidad</th>
                  <th>Observación (Opcional)</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                    {/* Añadir data-label a cada td */}
                    <td data-label="Seleccionar">
                      <input
                        type="checkbox"
                        checked={product.selected || false}
                        onChange={() => handleProductSelection(product.id)}
                      />
                    </td>
                    <td data-label="Producto">{product.nombre}</td>
                    <td data-label="Precio">${product.precioActual.toFixed(2)}</td>
                    <td data-label="Disponibles">{product.stock}</td>
                    <td data-label="Cantidad">
                      <input
                        type="number"
                        min="1"
                        max={product.stock} // Limitar al stock
                        value={product.quantity || 1}
                        onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value, 10) || 1)}
                        disabled={!product.selected || submitting}
                        style={{width: '60px'}}
                      />
                    </td>
                    <td data-label="Observación">
                      <input
                        type="text"
                        placeholder="Ej: sin sal"
                        value={observations[product.id] || ''}
                        onChange={(e) => handleObservationChange(product.id, e.target.value)}
                        disabled={!product.selected || submitting}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="generalObservation">Observación General del Pedido (Opcional):</label>
          <textarea
            id="generalObservation"
            value={generalObservation}
            onChange={(e) => setGeneralObservation(e.target.value)}
            placeholder="Ej: Entregar después de las 14hs"
            disabled={submitting}
            rows={3}
          />
        </div>

        <div className="buttons-container">
          <button type="button" onClick={onClose} className="cancel-button" disabled={submitting}>
            Cancelar
          </button>
          <button type="submit" disabled={submitting || products.filter(p => p.selected).length === 0}>
            {submitting ? 'Enviando...' : 'Confirmar Pedido'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;