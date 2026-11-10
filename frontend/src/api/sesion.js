import api from './client';

// La sesion del panel vive en localStorage: el token (que client.js manda en
// cada peticion) y los datos de la cuenta, incluido su rol: 'superadmin' o
// 'negocio' (ver docs/sql/06-roles-negocios.sql).
const CLAVE_TOKEN = 'token';
const CLAVE_USUARIO = 'usuario';

function guardarUsuario(usuario) {
  localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
}

export async function iniciarSesion(email, password) {
  const { data } = await api.post('/api/auth/login', { email, password });
  localStorage.setItem(CLAVE_TOKEN, data.token);
  guardarUsuario(data.usuario);
  return data.usuario;
}

export function cerrarSesion() {
  localStorage.removeItem(CLAVE_TOKEN);
  localStorage.removeItem(CLAVE_USUARIO);
}

export function usuarioActual() {
  if (!localStorage.getItem(CLAVE_TOKEN)) return null;
  try {
    const usuario = JSON.parse(localStorage.getItem(CLAVE_USUARIO));
    // Una sesion de antes de los roles no trae `rol`: hay que entrar de nuevo
    // (el gateway tampoco acepta ese token para escribir).
    if (!usuario?.rol) {
      cerrarSesion();
      return null;
    }
    return usuario;
  } catch {
    return null;
  }
}

export const esSuperadmin = (usuario) => usuario?.rol === 'superadmin';

export async function cambiarPassword(actual, nueva) {
  await api.post('/api/auth/cambiar-password', { actual, nueva });
  const usuario = usuarioActual();
  if (usuario) guardarUsuario({ ...usuario, debe_cambiar_password: false });
}

// Contrasena temporal para una cuenta nueva o restablecida: 12 caracteres sin
// los que se confunden al dictarla (0/O, 1/l/I).
export function generarTemporal() {
  const letras = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const azar = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(azar, (n) => letras[n % letras.length]).join('');
}
