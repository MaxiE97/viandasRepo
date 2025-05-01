// src/components/ProductForm.jsx
import React, { useState, useEffect } from 'react';
import ProductService from '../api/productService';
import API from '../api/axios'; // Importa tu instancia de Axios

const ProductForm = ({ product = null, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    precioActual: '',
    detalle: '',
    mostrarEnSistema: true,
    stock: '',
    stockMinimo: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [existingFoto, setExistingFoto] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // --- NUEVO: Determinar si estamos creando o editando ---
  const isEditing = product && product.id;

  useEffect(() => {
    if (isEditing) {
      setFormData({
        nombre: product.nombre,
        precioActual: product.precioActual,
        detalle: product.detalle || '',
        mostrarEnSistema: product.mostrarEnSistema,
        stock: product.stock,
        stockMinimo: product.stockMinimo,
      });
      setExistingFoto(product.foto || '');
      setSelectedFile(null);
    } else {
        setFormData({
            nombre: '', precioActual: '', detalle: '', mostrarEnSistema: true, stock: '', stockMinimo: ''
         });
         setExistingFoto('');
         setSelectedFile(null);
    }
    // Limpiar errores al cambiar de modo
    setError(null);
  }, [product, isEditing]); // <- Dependencia clave

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    } else {
        setSelectedFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploading(false);
    setError(null); // Limpiar errores previos

    try {
      // Validación básica de campos de texto/número (igual que antes)
      if (!formData.nombre || !formData.precioActual || !formData.stock || !formData.stockMinimo) {
        throw new Error('Por favor completa todos los campos obligatorios (*)');
      }

      // --- NUEVA VALIDACIÓN DE IMAGEN ---
      const imageRequired = !isEditing || (isEditing && !existingFoto);
      if (imageRequired && !selectedFile) {
          // Mensaje específico según el caso
          const errorMessage = !isEditing 
              ? 'Se requiere una imagen para crear un producto nuevo.'
              : 'Se requiere una imagen para este producto ya que no tiene una asignada.';
          throw new Error(errorMessage); 
      }
      // --- FIN VALIDACIÓN DE IMAGEN ---


      let fotoFilename = existingFoto;

      // 1. Si se seleccionó un nuevo archivo, subirlo PRIMERO
      if (selectedFile) {
        setUploading(true);
        const imageFormData = new FormData();
        imageFormData.append('file', selectedFile);

        try {
            const uploadResponse = await API.post('/products/upload-image/', imageFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fotoFilename = uploadResponse.data.filename;
        } catch (uploadError) {
             console.error("Error subiendo imagen:", uploadError.response?.data || uploadError.message);
             // Usar throw para que lo capture el catch general
             throw new Error(`Error al subir la imagen: ${uploadError.response?.data?.detail || uploadError.message}`);
        } finally {
            setUploading(false);
        }
      }

      // 2. Preparar datos del producto CON el nombre de archivo (nuevo o existente)
      const productData = {
        ...formData,
        precioActual: parseFloat(formData.precioActual),
        stock: parseInt(formData.stock),
        stockMinimo: parseInt(formData.stockMinimo),
        // Asegurar que se envíe null si no hay foto, incluso si existingFoto tenía algo pero se borró/nunca hubo
        foto: fotoFilename || null 
      };

      // 3. Crear o Actualizar el producto
      let result;
      if (isEditing) { // Usar la variable isEditing
        result = await ProductService.updateProduct(product.id, productData);
      } else {
        result = await ProductService.createProduct(productData);
      }

      setLoading(false);
      if (onSave) onSave(result); // Llamar al callback de éxito

    } catch (err) {
      // Captura errores de validación o de API
      setError(err.message || 'Error al guardar el producto'); // Mostrar el mensaje de error específico
      setLoading(false);
      setUploading(false);
    }
  };

  const imageBaseUrl = `${API.defaults.baseURL || 'http://localhost:8000'}/static/product_images/`;

  // --- Lógica para la etiqueta de la foto ---
  const fotoLabelText = () => {
      if (!isEditing) return 'Foto del Producto*:'; // Requerido para nuevos
      if (isEditing && !existingFoto) return 'Foto del Producto*:'; // Requerido si no tiene foto
      return 'Foto del Producto (Opcional):'; // Opcional si ya tiene foto
  };

  return (
    <div className="product-form">
      <h2>{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h2>
      {/* Mostrar el error general del formulario */}
      {error && <p className="error" style={{ marginBottom: '15px' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        {/* ... (campos: nombre, precio, stock, etc. sin cambios) ... */}
        <div className="form-group">
            <label htmlFor="nombre">Nombre*:</label>
            <input type="text" id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required disabled={loading}/>
        </div>
        <div className="form-group">
            <label htmlFor="precioActual">Precio Actual*:</label>
            <input type="number" id="precioActual" name="precioActual" value={formData.precioActual} onChange={handleChange} step="0.01" min="0" required disabled={loading}/>
        </div>
        <div className="form-group">
            <label htmlFor="stock">Stock*:</label>
            <input type="number" id="stock" name="stock" value={formData.stock} onChange={handleChange} min="0" required disabled={loading}/>
        </div>
        <div className="form-group">
            <label htmlFor="stockMinimo">Stock Mínimo*:</label>
            <input type="number" id="stockMinimo" name="stockMinimo" value={formData.stockMinimo} onChange={handleChange} min="0" required disabled={loading}/>
        </div>
        <div className="form-group">
            <label htmlFor="detalle">Detalle:</label>
            <textarea id="detalle" name="detalle" value={formData.detalle} onChange={handleChange} disabled={loading}/>
        </div>

        {/* --- Campo de Imagen Modificado --- */}
        <div className="form-group">
          {/* --- Etiqueta dinámica --- */}
          <label htmlFor="foto">{fotoLabelText()}</label>
          {/* Mostrar imagen actual si existe Y no hay una nueva seleccionada */}
          {existingFoto && !selectedFile && (
              <div style={{ marginBottom: '10px' }}>
                  <img
                      src={`${imageBaseUrl}${existingFoto}`}
                      alt={`Imagen actual de ${formData.nombre || 'producto'}`}
                      style={{ maxWidth: '100px', maxHeight: '100px', display: 'block', border: '1px solid #ccc' }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <small>Imagen actual: {existingFoto}</small>
              </div>
          )}
          {/* Mostrar preview de imagen nueva si se seleccionó */}
           {selectedFile && (
               <div style={{ marginBottom: '10px' }}>
                   <img
                       src={URL.createObjectURL(selectedFile)}
                       alt="Vista previa de la nueva imagen"
                       style={{ maxWidth: '100px', maxHeight: '100px', display: 'block', border: '1px solid #ccc' }}
                       onLoad={() => URL.revokeObjectURL(selectedFile)} // Limpiar object URL después de cargar
                   />
                    <small>Nueva imagen seleccionada: {selectedFile.name}</small>
               </div>
           )}

          <input
            type="file"
            id="foto"
            name="foto"
            accept="image/*"
            onChange={handleFileChange}
            disabled={loading}
          />
           {uploading && <p className="uploading-message">Subiendo imagen...</p>}
           {/* --- Mensaje de ayuda --- */}
            <small style={{ marginTop: '5px', display: 'block', color: '#6c757d' }}>
               {isEditing && existingFoto
                   ? 'Selecciona una imagen para reemplazar la actual (opcional).'
                   : 'Selecciona una imagen para el producto (obligatorio).'
               }
            </small>
        </div>
         {/* --- Fin Campo de Imagen --- */}

        <div className="form-group checkbox">
          <input type="checkbox" id="mostrarEnSistema" name="mostrarEnSistema" checked={formData.mostrarEnSistema} onChange={handleChange} disabled={loading}/>
          <label htmlFor="mostrarEnSistema">Mostrar en sistema</label>
        </div>

        <div className="buttons-container" style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
          <button type="submit" disabled={loading}>
            {loading ? (uploading ? 'Subiendo...' : 'Guardando...') : (isEditing ? 'Actualizar Producto' : 'Crear Producto')}
          </button>
          <button type="button" onClick={onCancel} className="cancel-button" disabled={loading}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;