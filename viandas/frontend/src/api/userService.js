// src/api/userService.js
import API from "./axios";

// Servicio para operaciones relacionadas con usuarios
const UserService = {
  // Registrar un nuevo usuario
  register: async (userData) => {
    try {
      const response = await API.post("/users/", userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obtener información del usuario actual
  getCurrentUser: async () => {
    try {
      const response = await API.get("/users/me");
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default UserService;