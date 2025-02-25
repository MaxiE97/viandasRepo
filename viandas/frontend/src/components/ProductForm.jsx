// src/components/ProductForm.jsx
import React, { useState, useEffect } from 'react';
import ProductService from '../api/productService';

const ProductForm = ({ product = null, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    precioActual: '',
    detalle: '',
    mostrarEnSistema: true,
    stock: '',
    stockMinimo: '',
    foto: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Si recibimos un producto, pre-llenamos el formulario
  useEffect(() => {
    if (product) {
      setFormData({
        nombre: product.nombre,
        precioActual: product.precioActual,
        detalle: product.detalle || '',
        mostrarEnSistema: product.mostrarEnSistema,
        stock: product.stock,
        stockMinimo: product.stockMinimo,
        foto: product.foto || ''
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validación básica
      if (!formData.nombre || !formData.precioActual || !formData.stock || !formData.stockMinimo) {
        throw new Error('Por favor completa todos los campos obligatorios');
      }

      // Convertir a números los campos numéricos
      const productData = {
        ...formData,
        precioActual: parseFloat(formData.precioActual),
        stock: parseInt(formData.stock),
        stockMinimo: parseInt(formData.stockMinimo)
      };

      let result;
      if (product) {
        // Actualizar producto existente
        result = await ProductService.updateProduct(product.id, productData);
      } else {
        // Crear nuevo producto
        result = await ProductService.createProduct(productData);
      }

      setLoading(false);
      if (onSave) onSave(result);
    } catch (err) {
      setError(err.message || 'Error al guardar el producto');
      setLoading(false);
    }
  };

  return (
    <div className="product-form">
      <h2>{product ? 'Editar Producto' : 'Nuevo Producto'}</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nombre">Nombre*:</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="precioActual">Precio Actual*:</label>
          <input
            type="number"
            id="precioActual"
            name="precioActual"
            value={formData.precioActual}
            onChange={handleChange}
            step="0.01"
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="stock">Stock*:</label>
          <input
            type="number"
            id="stock"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="stockMinimo">Stock Mínimo*:</label>
          <input
            type="number"
            id="stockMinimo"
            name="stockMinimo"
            value={formData.stockMinimo}
            onChange={handleChange}
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="detalle">Detalle:</label>
          <textarea
            id="detalle"
            name="detalle"
            value={formData.detalle}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="foto">URL de la Foto:</label>
          <input
            type="text"
            id="foto"
            name="foto"
            value={formData.foto}
            onChange={handleChange}
          />
        </div>

        <div className="form-group checkbox">
          <input
            type="checkbox"
            id="mostrarEnSistema"
            name="mostrarEnSistema"
            checked={formData.mostrarEnSistema}
            onChange={handleChange}
          />
          <label htmlFor="mostrarEnSistema">Mostrar en sistema</label>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Producto'}
        </button>
      </form>
    </div>
  );
};

export default ProductForm;