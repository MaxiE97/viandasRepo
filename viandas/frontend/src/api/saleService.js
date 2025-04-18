// viandasRepo-main/viandas/frontend/src/api/saleService.js
// (COMPLETO Y CORREGIDO con filtro de fecha)
import API from "./axios"; // Tu instancia configurada de Axios

const SALE_API_URL = '/sales'; // Prefijo base para las rutas de ventas

/**
 * Crea un nuevo pedido online para el usuario logueado.
 * @param {object} saleData - Datos de la venta (formato SaleWithLines: { observation, medioPago, line_of_sales: [...] }).
 * @returns {Promise<object>} - La venta creada con sus líneas.
 */
export const createOnlineSale = async (saleData) => {
  try {
    // El objeto saleData ya debería incluir medioPago desde OrderForm.jsx
    const response = await API.post(`${SALE_API_URL}/online`, saleData);
    return response.data;
  } catch (error) {
    console.error("Error creating online sale:", error.response?.data || error.message);
    // Mejorar el mensaje de error para el usuario
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string' && detail.includes("Stock insuficiente")) {
        throw new Error(detail); // Propagar mensaje específico de stock
    }
    throw error.response?.data || new Error("Error al crear el pedido online. Verifica los productos y cantidades.");
  }
};

/**
 * Obtiene los pedidos del usuario actual (Implementación Futura - sin cambios).
 * @returns {Promise<Array>} - Lista de ventas del usuario.
 */
export const getUserSales = async () => {
  try {
    const response = await API.get(`${SALE_API_URL}/user`);
    return response.data;
  } catch (error) {
    console.error("Error fetching user sales:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al obtener los pedidos del usuario");
  }
};

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


// --- MODIFICADA PARA ACEPTAR FECHA ---
/**
 * [ADMIN] Obtiene las ventas finalizadas (registradas), opcionalmente filtradas por fecha.
 * @param {string|null} date - Fecha en formato YYYY-MM-DD para filtrar, o null para todas.
 * @returns {Promise<Array>} - Lista de ventas finalizadas.
 */
export const getVentasFinalizadas = async (date = null) => { // <-- Añadir parámetro date
  try {
    // Crear objeto de parámetros para la query
    const params = {};
    if (date) {
      params.sale_date = date; // <-- Añadir sale_date si se proporciona date
    }
    // Pasar params a la llamada GET
    const response = await API.get(`${SALE_API_URL}/ventas`, { params }); // <-- Añadir { params }
    return response.data;
  } catch (error) {
    console.error("Error fetching ventas finalizadas:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al obtener ventas finalizadas");
  }
};
// --- FIN MODIFICACIÓN ---

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
    const response = await API.put(`${SALE_API_URL}/${saleId}/register`);
    return response.data;
  } catch (error) {
    console.error(`Error registering sale ${saleId} in caja:`, error.response?.data || error.message);
      // Propagar mensaje de error específico si es de stock
      const detail = error.response?.data?.detail;
      if (typeof detail === 'string' && detail.includes("Stock insuficiente")) {
          throw new Error(detail);
      }
    throw error.response?.data || new Error("Error al registrar venta en caja");
  }
};


/**
 * [ADMIN] Crea una venta manual en caja (cliente anónimo).
 * @param {object} saleData - Datos de la venta (formato SaleWithLines: { observation, medioPago, line_of_sales: [...] }).
 * @returns {Promise<object>} - La venta creada.
 */
export const createCajaSale = async (saleData) => {
  try {
    // saleData ya incluye medioPago desde CajaSaleForm.jsx
    const response = await API.post(`${SALE_API_URL}/ventas/caja`, saleData);
    return response.data;
  } catch (error) {
    console.error("Error creating caja sale:", error.response?.data || error.message);
    // Propagar mensaje de error específico si es de stock
      const detail = error.response?.data?.detail;
      if (typeof detail === 'string' && detail.includes("Stock insuficiente")) {
          throw new Error(detail);
      }
    throw error.response?.data || new Error("Error al crear venta en caja");
  }
};

/**
 * Obtiene los pedidos del usuario actual listos para retirar.
 * @returns {Promise<Array>} - Lista de ventas listas para retirar.
 */
export const getMyReadyOrders = async () => {
  try {
    const response = await API.get(`${SALE_API_URL}/my-orders/ready-for-pickup`);
    return response.data;
  } catch (error) {
    console.error("Error fetching ready orders:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al obtener los pedidos listos para retirar");
  }
};

// Si necesitas añadir más funciones (ej: marcar como no pagado, eliminar venta) puedes hacerlo aquí.