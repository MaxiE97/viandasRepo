// src/api/saleService.js
import API from "./axios";

// Servicio para operaciones relacionadas con ventas y pedidos
const SaleService = {
  // Crear un nuevo pedido online
  createOnlineSale: async (saleData) => {
    try {
      const response = await API.post("/sales/online", saleData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener pedidos del usuario (para posible implementación futura)
  getUserSales: async () => {
    try {
      const response = await API.get("/sales/user");
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default SaleService;