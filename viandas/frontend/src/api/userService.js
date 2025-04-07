// src/api/userService.js - Versión Refactorizada (solo exportaciones nombradas)
import API from "./axios";

const API_URL = '/users';

// Registrar un nuevo usuario
export const register = async (userData) => {
  try {
    const response = await API.post(`${API_URL}/`, userData); // Ajusta la ruta si es solo /users/ y no /users/register
    return response.data;
  } catch (error) {
    // Considera añadir un manejo de errores más específico aquí también
    console.error("Error registering user:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al registrar usuario");
  }
};

// Obtener información del usuario actual
export const getCurrentUser = async () => {
  try {
    const response = await API.get(`${API_URL}/me`);
    return response.data;
  } catch (error) {
    console.error("Error fetching current user:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al obtener usuario actual");
  }
};

// Actualizar email
export const updateUserEmail = async (email) => {
  try {
    // --- CORRECCIÓN AQUÍ ---
    // Enviamos 'email' como parámetro de consulta usando 'params'
    // El segundo argumento (body) es null porque no enviamos cuerpo
    const response = await API.put(`${API_URL}/update-user-email`, null, { 
      params: { email } 
    });
    // --- FIN CORRECCIÓN ---
    return response.data; 
  } catch (error) {
    console.error("Error updating user email:", error.response?.data || error.message);
    // Lanzamos el error para que el componente lo maneje
    throw error.response?.data || new Error("Error al actualizar el email"); 
  }
};

// Actualizar celular
export const updateUserCellphone = async (celular) => {
  try {
    // --- CORRECCIÓN AQUÍ ---
    // Enviamos 'celular' como parámetro de consulta usando 'params'
    const response = await API.put(`${API_URL}/update-user-cellphone`, null, { 
      params: { celular } 
    });
    // --- FIN CORRECCIÓN ---
    return response.data;
  } catch (error) {
    console.error("Error updating user cellphone:", error.response?.data || error.message);
     // Lanzamos el error para que el componente lo maneje
    throw error.response?.data || new Error("Error al actualizar el celular");
  }
};

