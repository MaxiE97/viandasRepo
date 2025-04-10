// src/components/ProductList.jsx
import React, { useState, useEffect } from 'react';
import ProductService from '../api/productService';
import API from '../api/axios';
// Ya no se necesita useAuth aquí si no hay lógica de admin
// import { useAuth } from '../context/AuthContext'; 

// Este componente ahora es solo para la vista de cliente
const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const { isAdmin } = useAuth(); // Ya no es necesario

  // URL base del backend
  const backendBaseUrl = API.defaults.baseURL || 'http://localhost:8000';
  const imageBaseUrl = `${backendBaseUrl}/static/product_images/`;

  // Cargar productos al montar
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        // Filtrar productos que estén marcados como 'mostrarEnSistema' si es necesario?
        // Depende si el backend ya lo hace. Asumamos que sí por ahora.
        const data = await ProductService.getProducts(); 
        // Podrías filtrar aquí si el backend no lo hace:
        // const visibleProducts = data.filter(p => p.mostrarEnSistema);
        // setProducts(visibleProducts);
        setProducts(data.filter(p => p.mostrarEnSistema)); // Filtrar en frontend por ahora
      } catch (err) {
        const errorDetail = err.response?.data?.detail || err.message || 'Error al cargar los productos';
        setError(errorDetail);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []); // Vacío para ejecutar solo al montar

  // Ya no hay handler para borrar aquí

  if (loading) return <p>Cargando productos...</p>;
  if (error) return <p className="error" style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div className="product-list">
      {products.length === 0 ? (
        <p>No hay productos disponibles en este momento.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {products.map((product) => {
            const filename = product.foto || null;
            const imageUrl = filename ? `${imageBaseUrl}${filename}` : null;

            return (
              <li key={product.id} className="product-item" style={{ marginBottom: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{
                     width: '100px', height: '100px', marginRight: '20px', float: 'left',
                     backgroundColor: '#f0f0f0', border: '1px solid #ddd',
                     display: 'flex', alignItems: 'center', justifyContent: 'center',
                     overflow: 'hidden', position: 'relative' 
                 }}>
                  {imageUrl ? (
                    <img
                      src={imageUrl} 
                      alt={`Imagen de ${product.nombre}`}
                      style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none'; const ph = e.target.nextElementSibling; if(ph) ph.style.display = 'flex'; }}
                      onLoad={(e) => { const ph = e.target.nextElementSibling; if(ph) ph.style.display = 'none';}}
                    />
                  ) : null}
                   <span style={{ display: imageUrl ? 'none' : 'flex', color: '#888', fontSize: '12px', textAlign: 'center' }}>
                       {imageUrl === null ? 'Sin Foto' : 'Error'}
                  </span>
                </div>
                
                <div style={{ marginLeft: '120px' }}>
                  <h3>{product.nombre}</h3>
                  <p><strong>Precio:</strong> ${product.precioActual?.toFixed(2)}</p>
                  {/* No mostrar Stock ni Stock Mínimo a clientes */}
                  {product.detalle && <p><strong>Detalle:</strong> {product.detalle}</p>}
                  {/* No hay botones de admin aquí */}
                </div>
                <div style={{ clear: 'both' }}></div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ProductList;