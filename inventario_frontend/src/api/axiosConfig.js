import axios from 'axios';

// Configuración base de Axios
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Errores 4xx/5xx
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // La solicitud fue hecha pero no hubo respuesta
      return Promise.reject({ message: 'No response from server' });
    } else {
      // Error al configurar la solicitud
      return Promise.reject({ message: error.message });
    }
  }
);

export default api;