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

  // --- NUEVO: Estado para medio de pago ---
  const [paymentMethod, setPaymentMethod] = useState('Efectivo'); // Default Efectivo

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      setErrorProducts(null);
      try {
        const data = await ProductService.getProducts();
        // Usamos tu lógica de filtrado original (mostrar solo con stock > 0)
        const availableProducts = data.filter(p => p.mostrarEnSistema && p.stock > 0);
        setProducts(availableProducts);

        const initialQuantities = availableProducts.reduce((acc, product) => {
           acc[product.id] = '';
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

  // Usamos tu lógica original de handleQuantityChange
  const handleQuantityChange = (productId, value) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const rawValue = parseInt(value, 10);
    const quantity = isNaN(rawValue) ? '' : Math.max(0, Math.min(rawValue, product.stock));
    setQuantities(prevQuantities => ({
      ...prevQuantities,
      [productId]: quantity === 0 ? '' : quantity
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const lineItems = Object.entries(quantities)
      .map(([productId, cantidad]) => ({
        product_id: parseInt(productId, 10),
        cantidad: parseInt(cantidad, 10) || 0
      }))
      .filter(item => item.cantidad > 0);

    if (lineItems.length === 0) {
      setSubmitError('Debes agregar al menos un producto con cantidad mayor a cero.');
      setSubmitting(false);
      return;
    }

    // --- CAMBIO: Incluir medio de pago ---
    const saleData = {
      observation: observation.trim() || null,
      medioPago: paymentMethod, // <-- Incluir el seleccionado
      line_of_sales: lineItems
    };
    // -----------------------------------

    try {
      await createCajaSale(saleData);
      if (onSaleCreated) {
        onSaleCreated();
      }
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Error al registrar la venta.';
       console.error("Error detallado al crear venta en caja:", err.response?.data || err);
      setSubmitError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Función auxiliar para deshabilitar el botón de submit
   const isSubmitDisabled = () => {
     if (submitting) return true;
     const hasQuantity = Object.values(quantities).some(q => q && parseInt(q, 10) > 0);
     return !hasQuantity; // Deshabilitar si no hay ninguna cantidad > 0
   }


  if (loadingProducts) return <p>Cargando productos...</p>;

  return (
    <div className="caja-sale-form">
      {/* El título h2 lo maneja el Modal, si no, añádelo aquí */}
      <h2>Registrar Venta en Caja</h2>
      {errorProducts && <p className="error">{errorProducts}</p>}
      {submitError && <p className="error">{submitError}</p>}

      <form onSubmit={handleSubmit}>
        <div className="product-selection" style={{ maxHeight: '45vh', overflowY: 'auto', marginBottom: '1rem' }}>
         {products.length === 0 ? (
            <p>No hay productos con stock disponibles para vender.</p>
          ) : (
            <table className="product-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio Unit.</th>
                  <th>Stock Disp.</th> {/* Cambiado desde Stock Actual */}
                  <th>Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id}>
                    <td data-label="Producto">{product.nombre}</td>
                    <td data-label="Precio Unit.">${product.precioActual.toFixed(2)}</td>
                    <td data-label="Stock Disp.">{product.stock}</td> {/* Cambiado */}
                    <td data-label="Cantidad">
                      <input
                        type="number"
                        min="0"
                        max={product.stock} // Ahora sí ponemos el max aquí
                        value={quantities[product.id] || ''}
                        onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                        style={{ width: '70px' }}
                        disabled={submitting}
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
           )}
        </div>

        {/* --- NUEVO: Selección de Medio de Pago --- */}
        <div className="form-group">
          <label htmlFor="cajaPaymentMethod">Medio de Pago:</label>
          <select
            id="cajaPaymentMethod"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            disabled={submitting}
            required // Asegurarse de que se seleccione uno
          >
            <option value="Efectivo">Efectivo</option>
            <option value="Transferencia">Transferencia</option>
          </select>
        </div>
        {/* --- FIN NUEVO --- */}

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
            // --- CAMBIO: Usar función para deshabilitar ---
            disabled={isSubmitDisabled()}
          >
            {submitting ? 'Registrando...' : 'Registrar Venta'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CajaSaleForm;