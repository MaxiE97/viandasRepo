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
    // foto: '' // Ya no almacenamos la URL/filename aquí directamente
  });
  // Nuevo estado para el archivo de imagen seleccionado
  const [selectedFile, setSelectedFile] = useState(null);
  // Estado para la URL/filename existente (si estamos editando)
  const [existingFoto, setExistingFoto] = useState('');

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false); // Estado para la subida

  useEffect(() => {
    if (product) {
      setFormData({
        nombre: product.nombre,
        precioActual: product.precioActual,
        detalle: product.detalle || '',
        mostrarEnSistema: product.mostrarEnSistema,
        stock: product.stock,
        stockMinimo: product.stockMinimo,
      });
      setExistingFoto(product.foto || ''); // Guardar foto existente
      setSelectedFile(null); // Resetear archivo seleccionado al cargar producto
    } else {
        // Resetear todo si es un producto nuevo
         setFormData({
            nombre: '', precioActual: '', detalle: '', mostrarEnSistema: true, stock: '', stockMinimo: ''
         });
         setExistingFoto('');
         setSelectedFile(null);
    }
  }, [product]); // <- Dependencia clave

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Nuevo manejador para el input de archivo
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null); // Limpiar error si selecciona un archivo
    } else {
        setSelectedFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Loading general
    setUploading(false); // Resetear uploading
    setError(null);

    try {
      // Validación básica
      if (!formData.nombre || !formData.precioActual || !formData.stock || !formData.stockMinimo) {
        throw new Error('Por favor completa todos los campos obligatorios (*)');
      }

      let fotoFilename = existingFoto; // Empezar con la foto existente

      // 1. Si se seleccionó un nuevo archivo, subirlo PRIMERO
      if (selectedFile) {
        setUploading(true); // Indicar que estamos subiendo
        const imageFormData = new FormData();
        imageFormData.append('file', selectedFile);

        try {
            // Hacer la llamada al nuevo endpoint de subida
            const uploadResponse = await API.post('/products/upload-image/', imageFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data' // Importante para archivos
                }
            });
            // Obtener el nombre de archivo guardado
            fotoFilename = uploadResponse.data.filename; 
            // Opcional: Si actualizamos, borrar la foto vieja del estado local
            // setExistingFoto(''); 
        } catch (uploadError) {
             console.error("Error subiendo imagen:", uploadError.response?.data || uploadError.message);
             // Mostrar error específico de la subida
             setError(`Error al subir la imagen: ${uploadError.response?.data?.detail || uploadError.message}`);
             setLoading(false); // Detener el loading general
             setUploading(false);
             return; // Detener el proceso si falla la subida
        } finally {
            setUploading(false); // Terminar estado de subida
        }
      }

      // 2. Preparar datos del producto CON el nombre de archivo (nuevo o existente)
      const productData = {
        ...formData,
        precioActual: parseFloat(formData.precioActual),
        stock: parseInt(formData.stock),
        stockMinimo: parseInt(formData.stockMinimo),
        foto: fotoFilename || null // Enviar null si no hay foto
      };

      // 3. Crear o Actualizar el producto
      let result;
      if (product && product.id) { // Asegurarse que product y product.id existen para actualizar
        // Actualizar producto existente
        result = await ProductService.updateProduct(product.id, productData);
      } else {
        // Crear nuevo producto
        result = await ProductService.createProduct(productData);
      }

      setLoading(false);
      if (onSave) onSave(result); // Llamar al callback de éxito

    } catch (err) {
      // Manejar errores de la creación/actualización del producto
      setError(err.detail || err.message || 'Error al guardar el producto');
      setLoading(false);
      setUploading(false); // Asegurarse que uploading esté en false si hay error
    }
  };

  // URL base del backend para mostrar imágenes existentes
  // Usar API.defaults.baseURL si está configurado, sino el valor por defecto
  const imageBaseUrl = `${API.defaults.baseURL || 'http://localhost:8000'}/static/product_images/`;


  return (
    <div className="product-form">
      <h2>{product ? 'Editar Producto' : 'Nuevo Producto'}</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        {/* ... (campos: nombre, precio, stock, etc.) ... */}
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
          <label htmlFor="foto">Foto del Producto:</label>
          {/* Mostrar imagen actual si existe Y no hay una nueva seleccionada */}
          {existingFoto && !selectedFile && (
              <div style={{ marginBottom: '10px' }}>
                  <img 
                      src={`<span class="math-inline">\{imageBaseUrl\}</span>{existingFoto}`} 
                      alt={`Imagen actual de ${formData.nombre || 'producto'}`} 
                      style={{ maxWidth: '100px', maxHeight: '100px', display: 'block', border: '1px solid #ccc' }} 
                      // Añadir manejo de error por si la imagen no carga
                      onError={(e) => { e.target.style.display = 'none'; /* O mostrar placeholder */ }}
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
            type="file" // Cambiado a file
            id="foto"
            name="foto"
            accept="image/*" // Aceptar solo imágenes
            onChange={handleFileChange} // Usar el nuevo manejador
            disabled={loading} // Deshabilitar mientras guarda/sube
          />
           {uploading && <p>Subiendo imagen...</p>} 
           <small>Selecciona una imagen para subir o cambiar la actual.</small>
        </div>
         {/* --- Fin Campo de Imagen --- */}

        <div className="form-group checkbox">
          <input type="checkbox" id="mostrarEnSistema" name="mostrarEnSistema" checked={formData.mostrarEnSistema} onChange={handleChange} disabled={loading}/>
          <label htmlFor="mostrarEnSistema">Mostrar en sistema</label>
        </div>

        <div className="buttons-container" style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
          <button type="submit" disabled={loading}>
            {loading ? (uploading ? 'Subiendo...' : 'Guardando...') : (product ? 'Actualizar Producto' : 'Crear Producto')}
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