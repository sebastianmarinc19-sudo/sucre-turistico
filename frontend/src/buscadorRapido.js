// Abrir el buscador rapido (Ctrl+K) desde cualquier parte: el encabezado, la
// barra inferior del celular o el buscador de la portada. Es un evento del
// navegador para no tener que pasar estado por toda la app.
const EVENTO = 'st:abrir-buscador';

export function abrirBuscadorRapido(texto = '') {
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: { texto } }));
}

export function alPedirBuscador(manejar) {
  const oyente = (e) => manejar(e.detail?.texto || '');
  window.addEventListener(EVENTO, oyente);
  return () => window.removeEventListener(EVENTO, oyente);
}

// Sin tildes ni mayusculas: "covenas" encuentra "Coveñas".
export const normalizar = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
