// src/components/CajaSaleForm.jsx
import React, { useState, useEffect } from 'react';
import ProductService from '../api/productService';
import { createCajaSale } from '../api/saleService'; // Para crear la venta en caja

const CajaSaleForm = ({ onClose, onSaleCreated }) => {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProducts, setErrorProducts] = useState(null);
  
  // Estado para las cantidades y observaciones
  // Usamos un objeto para mapear productId -> cantidad
  const [quantities, setQuantities] = useState({}); 
  const [observation, setObservation] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Cargar productos al montar
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      setErrorProducts(null);
      try {
        const data = await ProductService.getProducts();
        setProducts(data);
        // Inicializar cantidades en 0 o vacío (opcional)
        const initialQuantities = data.reduce((acc, product) => {
           acc[product.id] = ''; // O 0 si prefieres
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

  // Manejar cambio en la cantidad de un producto
  const handleQuantityChange = (productId, value) => {
    // Convertir a número, asegurarse que no sea negativo
    const quantity = Math.max(0, parseInt(value, 10) || 0); 
    setQuantities(prevQuantities => ({
      ...prevQuantities,
      [productId]: quantity 
    }));
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    // Filtrar productos con cantidad > 0
    const lineItems = Object.entries(quantities)
      .map(([productId, cantidad]) => ({
        product_id: parseInt(productId, 10),
        cantidad: cantidad
      }))
      .filter(item => item.cantidad > 0);

    if (lineItems.length === 0) {
      setSubmitError('Debes agregar al menos un producto con cantidad mayor a cero.');
      setSubmitting(false);
      return;
    }

    // Preparar datos para la API (formato SaleWithLines)
    const saleData = {
      observation: observation.trim() || null, // Enviar null si está vacío
      line_of_sales: lineItems // El backend espera 'line_of_sales' según schema
    };

    try {
      await createCajaSale(saleData);
      // Notificar al componente padre que se creó la venta
      if (onSaleCreated) {
        onSaleCreated(); 
      }
      onClose(); // Cerrar el modal en éxito
    } catch (err) {
      setSubmitError(err.detail || err.message || 'Error al registrar la venta.');
    } finally {
      setSubmitting(false);
    }
  };

  // Renderizado
  if (loadingProducts) return <p>Cargando productos...</p>;
  if (errorProducts) return <p className="error">{errorProducts}</p>;

  return (
    <div className="caja-sale-form">
      <h2>Registrar Venta Manual en Caja</h2>
      {submitError && <p className="error">{submitError}</p>}
      
      <form onSubmit={handleSubmit}>
        <div className="product-selection" style={{ maxHeight: '40vh', overflowY: 'auto', marginBottom: '15px' }}>
          <table className="product-table"> {/* Reutiliza estilos si existen */}
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
                  <td>{product.nombre}</td>
                  <td>${product.precioActual.toFixed(2)}</td>
                  <td>{product.stock}</td>
                  <td>
                    <input 
                      type="number"
                      min="0"
                      // Podrías añadir max={product.stock} si quieres validar stock aquí
                      value={quantities[product.id] || ''} // Mostrar '' si es 0 o undefined
                      onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                      style={{ width: '70px' }} // Ajusta el ancho
                      disabled={submitting}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            disabled={submitting || Object.values(quantities).every(q => !q || q <= 0)} // Deshabilitar si no hay cantidades > 0
          >
            {submitting ? 'Registrando...' : 'Registrar Venta'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CajaSaleForm;