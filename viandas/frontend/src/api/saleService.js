// src/api/saleService.js
import API from "./axios"; // Tu instancia configurada de Axios

const SALE_API_URL = '/sales'; // Prefijo base para las rutas de ventas

// --- Funciones existentes ---

/**
 * Crea un nuevo pedido online para el usuario logueado.
 * @param {object} saleData - Datos de la venta (formato SaleWithLines: { observation, line_of_sales: [...] }).
 * @returns {Promise<object>} - La venta creada con sus líneas.
 */
export const createOnlineSale = async (saleData) => {
  try {
    // Asume que la ruta para crear venta online es /sales/online
    const response = await API.post(`${SALE_API_URL}/online`, saleData); 
    return response.data;
  } catch (error) {
    console.error("Error creating online sale:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al crear el pedido online");
  }
};

/**
 * Obtiene los pedidos del usuario actual (Implementación Futura).
 * @returns {Promise<Array>} - Lista de ventas del usuario.
 */
export const getUserSales = async () => {
  try {
    // Asume una ruta /sales/user para obtener ventas del usuario logueado
    const response = await API.get(`${SALE_API_URL}/user`); 
    return response.data;
  } catch (error) {
    console.error("Error fetching user sales:", error.response?.data || error.message);
    // Podrías querer un mensaje de error más específico si se implementa
    throw error.response?.data || new Error("Error al obtener los pedidos del usuario"); 
  }
};

// --- Nuevas Funciones para Admin Sales ---

/**
 * [ADMIN] Obtiene los pedidos solicitados online (no confirmados, no registrados).
 * @returns {Promise<Array>} - Lista de ventas/pedidos.
 */
export const getPedidosSolicitados = async () => {
  try {
    const response = await API.get(`${SALE_API_URL}/pedidos-solicitados`);
    return response.data;
  } catch (error) {
    console.error("Error fetching pedidos solicitados:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al obtener pedidos solicitados");
  }
};

/**
 * [ADMIN] Obtiene los pedidos pendientes de retiro (confirmados, no registrados).
 * @returns {Promise<Array>} - Lista de ventas/pedidos.
 */
export const getPedidosPendientesRetiro = async () => {
  try {
    const response = await API.get(`${SALE_API_URL}/pendientes-retiro`);
    return response.data;
  } catch (error) {
    console.error("Error fetching pendientes de retiro:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al obtener pedidos pendientes");
  }
};

/**
 * [ADMIN] Obtiene las ventas finalizadas (registradas o confirmadas según backend).
 * @returns {Promise<Array>} - Lista de ventas finalizadas.
 */
export const getVentasFinalizadas = async () => {
  try {
    // El endpoint en tu backend para esto es /sales/ventas
    const response = await API.get(`${SALE_API_URL}/ventas`); 
    return response.data;
  } catch (error) {
    console.error("Error fetching ventas finalizadas:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al obtener ventas finalizadas");
  }
};

/**
 * [ADMIN] Confirma un pedido online.
 * @param {number} saleId - ID de la venta a confirmar.
 * @returns {Promise<object>} - La venta actualizada.
 */
export const confirmSale = async (saleId) => {
  try {
    const response = await API.put(`${SALE_API_URL}/${saleId}/confirm`);
    return response.data;
  } catch (error) {
    console.error(`Error confirming sale ${saleId}:`, error.response?.data || error.message);
    throw error.response?.data || new Error("Error al confirmar el pedido");
  }
};

/**
 * [ADMIN] Marca una venta como pagada.
 * @param {number} saleId - ID de la venta.
 * @returns {Promise<object>} - La venta actualizada.
 */
export const markAsPaid = async (saleId) => {
  try {
    const response = await API.put(`${SALE_API_URL}/${saleId}/pagado`);
    return response.data;
  } catch (error) {
    console.error(`Error marking sale ${saleId} as paid:`, error.response?.data || error.message);
    throw error.response?.data || new Error("Error al marcar como pagado");
  }
};

/**
 * [ADMIN] Marca una venta como registrada en caja (retirada).
 * @param {number} saleId - ID de la venta.
 * @returns {Promise<object>} - La venta actualizada.
 */
export const registerSaleInCaja = async (saleId) => {
  try {
    // Usa el endpoint que creamos en el backend: PUT /sales/{sale_id}/register
    const response = await API.put(`${SALE_API_URL}/${saleId}/register`); 
    return response.data;
  } catch (error) {
    console.error(`Error registering sale ${saleId} in caja:`, error.response?.data || error.message);
    throw error.response?.data || new Error("Error al registrar venta en caja");
  }
};


/**
 * [ADMIN] Crea una venta manual en caja (cliente anónimo).
 * @param {object} saleData - Datos de la venta (formato SaleWithLines: { observation, line_of_sales: [{cantidad, product_id}] }).
 * @returns {Promise<object>} - La venta creada.
 */
export const createCajaSale = async (saleData) => {
  try {
    // El endpoint es POST /sales/ventas/caja según tu backend
    const response = await API.post(`${SALE_API_URL}/ventas/caja`, saleData); 
    return response.data;
  } catch (error) {
    console.error("Error creating caja sale:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al crear venta en caja");
  }
};

// No se necesita export default al usar exportaciones nombradas