// src/api/productService.js
import API from './axios';

// Servicio para operaciones relacionadas con productos
const ProductService = {
  // Obtener todos los productos
  getProducts: async () => {
    try {
      const response = await API.get('/products/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener un producto por ID
  getProductById: async (id) => {
    try {
      const response = await API.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Crear un nuevo producto (requiere permisos de admin)
  createProduct: async (productData) => {
    try {
      const response = await API.post('/products/', productData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Actualizar un producto existente (requiere permisos de admin)
  updateProduct: async (id, productData) => {
    try {
      const response = await API.put(`/products/${id}`, productData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Eliminar un producto (requiere permisos de admin)
  deleteProduct: async (id) => {
    try {
      await API.delete(`/products/${id}`);
      return true;
    } catch (error) {
      throw error;
    }
  }
};

export default ProductService;