// src/components/ProductList.jsx
import React, { useState, useEffect } from 'react'; // Ya no necesitamos useState aquí
import ProductService from '../api/productService';
import API from '../api/axios';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // --- ELIMINADO: Estado para zoom ---
  // const [zoomedImageUrl, setZoomedImageUrl] = useState(null);

  const backendBaseUrl = API.defaults.baseURL || 'http://localhost:8000';
  const imageBaseUrl = `${backendBaseUrl}/static/product_images/`;

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await ProductService.getProducts();
        setProducts(data.filter(p => p.mostrarEnSistema));
      } catch (err) {
        const errorDetail = err.response?.data?.detail || err.message || 'Error al cargar los productos';
        setError(errorDetail);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // --- ELIMINADO: Handlers para zoom ---
  // const handleImageClick = (imageUrl) => { ... };
  // const handleCloseZoom = () => { ... };

  // --- NUEVO: Función para formatear precio ---
  const formatPrice = (price) => {
    // Convierte a número por si acaso, luego formatea
    const numberPrice = Number(price);
    if (isNaN(numberPrice)) {
      return 'N/A'; // O manejar como prefieras si no es número
    }
    // Usa toLocaleString con locale 'es-AR' para puntos de miles y sin decimales
    return numberPrice.toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  if (loading) return <p>Cargando productos...</p>;
  if (error) return <p className="error">{`Error: ${error}`}</p>;

  return (
    // Quitamos el Fragment <> innecesario ahora
    <div className="product-list">
      {products.length === 0 ? (
        <p>No hay productos disponibles en este momento.</p>
      ) : (
        <ul>
          {products.map((product) => {
            const filename = product.foto || null;
            const imageUrl = filename ? `${imageBaseUrl}${filename}` : null;

            return (
              <li key={product.id} className="product-item">
                {/* --- CAMBIO: Eliminado onClick y otros props de zoom/accesibilidad --- */}
                <div className="image-container">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={`Imagen de ${product.nombre}`}
                    />
                  ) : (
                    <span className="image-placeholder">Sin Foto</span>
                  )}
                </div>
                <div className="product-info">
                  <h3>{product.nombre}</h3>
                  {/* --- CAMBIO: Eliminado style que limitaba altura --- */}
                  {product.detalle && (
                     <p>
                         <strong>Detalle:</strong> {product.detalle}
                     </p>
                  )}
                  <p className="price">
                    {/* --- CAMBIO: Aplicar formato de precio --- */}
                    <strong>Precio:</strong> ${formatPrice(product.precioActual)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
    // --- ELIMINADO: Lightbox Overlay ---
  );
};

export default ProductList;