import axios from 'axios';

// Todas las peticiones pasan por el API Gateway, nunca directo a un microservicio.
// Asi el front no tiene que saber en que puerto vive cada servicio.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  // Los servicios gratis de Render se duermen tras 15 min sin trafico y tardan
  // ~50 s en despertar: con menos tiempo, la primera visita siempre fallaria.
  timeout: 60000,
});

// Si hay un token de administrador guardado, va en cada peticion.
// Las lecturas (GET) no lo necesitan, pero crear/editar/borrar si.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Cuando un microservicio gratis de Render esta dormido, la llamada del gateway
// recibe 429 al instante en vez de esperar a que arranque (~50 s). Las lecturas
// se reintentan hasta que despierte; las escrituras no, para no duplicar datos.
const ESTADOS_REINTENTABLES = [429, 502, 503, 504];
const ESPERA_MS = 5000;
const MAX_REINTENTOS = 12;

api.interceptors.response.use(undefined, async (error) => {
  const { config, response } = error;
  const reintentable = config?.method === 'get' && ESTADOS_REINTENTABLES.includes(response?.status);
  if (!reintentable) throw error;
  config.__reintentos = (config.__reintentos || 0) + 1;
  if (config.__reintentos > MAX_REINTENTOS) throw error;

  await new Promise((resolve) => setTimeout(resolve, ESPERA_MS));
  return api(config);
});

// Un 401 fuera del login significa que el token vencio (dura 8 horas) o no es
// valido: se borra la sesion y, si se estaba en el panel, se vuelve al login.
api.interceptors.response.use(undefined, (error) => {
  const esLogin = error.config?.url?.includes('/api/auth/login');
  if (error.response?.status === 401 && !esLogin) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    if (window.location.pathname.startsWith('/admin')) window.location.assign('/admin/login');
  }
  throw error;
});

// Traduce los errores de axios a un mensaje que se le pueda mostrar a una persona.
export function mensajeDeError(error) {
  if (error.code === 'ECONNABORTED') {
    return 'El servidor tardo demasiado en responder.';
  }
  if (!error.response) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.';
  }
  if (error.response.status === 404) {
    return 'No encontramos lo que buscabas.';
  }
  if (error.response.status === 401) {
    return 'Necesitas iniciar sesion como administrador para hacer esto.';
  }
  if (ESTADOS_REINTENTABLES.includes(error.response.status)) {
    return 'El servidor se esta iniciando. Recarga la pagina en un momento.';
  }
  return error.response.data?.error || `Error ${error.response.status} del servidor.`;
}

export default api;
