// src/components/CajaSaleForm.jsx
import React, { useState, useEffect } from 'react';
import ProductService from '../api/productService';
import { createCajaSale } from '../api/saleService';

const CajaSaleForm = ({ onClose, onSaleCreated }) => {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProducts, setErrorProducts] = useState(null);

  const [quantities, setQuantities] = useState({});
  const [observation, setObservation] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      setErrorProducts(null);
      try {
        const data = await ProductService.getProducts();
        // Filtrar productos que se muestran y tienen stock
        const availableProducts = data.filter(p => p.mostrarEnSistema && p.stock > 0);
        setProducts(availableProducts);

        const initialQuantities = availableProducts.reduce((acc, product) => {
           acc[product.id] = ''; // Inicializar vacío
           return acc;
        }, {});
        setQuantities(initialQuantities);
      } catch (err) {
        setErrorProducts('Error al cargar los productos disponibles.');
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  const handleQuantityChange = (productId, value) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Permitir vacío o 0, pero validar contra stock máximo
    const rawValue = parseInt(value, 10);
    const quantity = isNaN(rawValue) ? '' : Math.max(0, Math.min(rawValue, product.stock));

    setQuantities(prevQuantities => ({
      ...prevQuantities,
      [productId]: quantity === 0 ? '' : quantity // Guardar '' si es 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const lineItems = Object.entries(quantities)
      .map(([productId, cantidad]) => ({
        product_id: parseInt(productId, 10),
        cantidad: parseInt(cantidad, 10) || 0 // Asegurar que sea número, 0 si está vacío
      }))
      .filter(item => item.cantidad > 0); // Filtrar los que tienen cantidad > 0

    if (lineItems.length === 0) {
      setSubmitError('Debes agregar al menos un producto con cantidad mayor a cero.');
      setSubmitting(false);
      return;
    }

    const saleData = {
      observation: observation.trim() || null,
      line_of_sales: lineItems
    };

    try {
      await createCajaSale(saleData);
      if (onSaleCreated) {
        onSaleCreated();
      }
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Error al registrar la venta.';
       console.error("Error detallado:", err.response?.data || err);
      setSubmitError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProducts) return <p>Cargando productos...</p>;

  return (
    <div className="caja-sale-form">
      {/* Título h2 gestionado por Modal */}
      {errorProducts && <p className="error">{errorProducts}</p>}
      {submitError && <p className="error">{submitError}</p>}

      <form onSubmit={handleSubmit}>
        <div className="product-selection" style={{ maxHeight: '50vh', overflowY: 'auto', marginBottom: '1rem' }}>
         {products.length === 0 ? (
            <p>No hay productos con stock disponibles para vender.</p>
          ) : (
            <table className="product-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio Unit.</th>
                  <th>Stock Actual</th>
                  <th>Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                     {/* Añadir data-label a cada td */}
                    <td data-label="Producto">{product.nombre}</td>
                    <td data-label="Precio Unit.">${product.precioActual.toFixed(2)}</td>
                    <td data-label="Stock Actual">{product.stock}</td>
                    <td data-label="Cantidad">
                      <input
                        type="number"
                        min="0"
                        max={product.stock} // Máximo es el stock actual
                        value={quantities[product.id] || ''}
                        onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                        style={{ width: '70px' }}
                        disabled={submitting}
                        placeholder="0" // Placeholder
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
           )}
        </div>

        <div className="form-group">
          <label htmlFor="cajaObservation">Observación (Opcional):</label>
          <textarea
            id="cajaObservation"
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="Notas adicionales sobre la venta"
            disabled={submitting}
            rows={2}
          />
        </div>

        <div className="buttons-container">
          <button
            type="button"
            onClick={onClose}
            className="cancel-button"
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting || Object.values(quantities).every(q => !q || q <= 0)}
          >
            {submitting ? 'Registrando...' : 'Registrar Venta'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CajaSaleForm;