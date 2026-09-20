import axios from 'axios';

// Todas las peticiones pasan por el API Gateway, nunca directo a un microservicio.
// Asi el front no tiene que saber en que puerto vive cada servicio.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  timeout: 10000,
});

// Si hay un token de administrador guardado, va en cada peticion.
// Las lecturas (GET) no lo necesitan, pero crear/editar/borrar si.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Traduce los errores de axios a un mensaje que se le pueda mostrar a una persona.
export function mensajeDeError(error) {
  if (error.code === 'ECONNABORTED') {
    return 'El servidor tardo demasiado en responder.';
  }
  if (!error.response) {
    return 'No se pudo conectar con el servidor. ¿Esta corriendo el API Gateway en el puerto 4000?';
  }
  if (error.response.status === 404) {
    return 'Ese endpoint todavia no existe en el microservicio.';
  }
  if (error.response.status === 401) {
    return 'Necesitas iniciar sesion como administrador para hacer esto.';
  }
  return error.response.data?.error || `Error ${error.response.status} del servidor.`;
}

export default api;
