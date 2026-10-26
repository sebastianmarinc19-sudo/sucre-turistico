import { useSyncExternalStore } from 'react';

// Favoritos del turista, guardados en este navegador (sin cuenta).
// Se guarda una copia del registro para poder mostrar la tarjeta sin volver
// a pedirlo a la API; si despues cambia, la copia se actualiza al volver a
// marcarlo. localStorage puede no existir (modo privado, bloqueado): todo va
// con try/catch y, si falla, los favoritos duran lo que dure la pestaña.

const CLAVE = 'sucre-turistico:favoritos';
const oyentes = new Set();

function leer() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE));
    return Array.isArray(guardado) ? guardado : [];
  } catch {
    return [];
  }
}

let favoritos = leer();

function guardar(lista) {
  favoritos = lista;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista));
  } catch {
    // Sin almacenamiento: quedan en memoria.
  }
  oyentes.forEach((avisar) => avisar());
}

const clave = (seccion, id) => `${seccion}:${id}`;

export function esFavorito(seccion, id) {
  return favoritos.some((f) => clave(f.seccion, f.registro.id) === clave(seccion, id));
}

// Devuelve true si quedo marcado, false si se quito.
export function alternarFavorito(seccion, registro) {
  if (esFavorito(seccion, registro.id)) {
    guardar(favoritos.filter((f) => clave(f.seccion, f.registro.id) !== clave(seccion, registro.id)));
    return false;
  }
  // Sin la carta de platos: es pesada y la tarjeta no la usa.
  const { platos: _platos, ...copia } = registro;
  guardar([{ seccion, registro: copia }, ...favoritos]);
  return true;
}

function suscribir(avisar) {
  oyentes.add(avisar);
  // Otra pestaña cambio los favoritos: releer.
  const alCambiarEnOtraPestana = (e) => {
    if (e.key === CLAVE) {
      favoritos = leer();
      avisar();
    }
  };
  window.addEventListener('storage', alCambiarEnOtraPestana);
  return () => {
    oyentes.delete(avisar);
    window.removeEventListener('storage', alCambiarEnOtraPestana);
  };
}

export function useFavoritos() {
  return useSyncExternalStore(suscribir, () => favoritos);
}
