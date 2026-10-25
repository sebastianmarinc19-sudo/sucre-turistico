import api from './client';

// La sesion del administrador vive en localStorage: el token (que client.js
// manda en cada peticion) y los datos basicos del usuario para mostrarlos.
const CLAVE_TOKEN = 'token';
const CLAVE_USUARIO = 'usuario';

export async function iniciarSesion(email, password) {
  const { data } = await api.post('/api/auth/login', { email, password });
  localStorage.setItem(CLAVE_TOKEN, data.token);
  localStorage.setItem(CLAVE_USUARIO, JSON.stringify(data.usuario));
  return data.usuario;
}

export function cerrarSesion() {
  localStorage.removeItem(CLAVE_TOKEN);
  localStorage.removeItem(CLAVE_USUARIO);
}

export function usuarioActual() {
  if (!localStorage.getItem(CLAVE_TOKEN)) return null;
  try {
    return JSON.parse(localStorage.getItem(CLAVE_USUARIO));
  } catch {
    return null;
  }
}
