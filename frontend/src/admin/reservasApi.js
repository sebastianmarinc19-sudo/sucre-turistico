import api from '../api/client';
import { CATALOGO, RESERVABLES } from '../catalogo';

// Trae las reservas de las tres secciones que las reciben (el gateway y cada
// servicio filtran: el negocio solo ve las de sus fichas). Si una seccion
// falla, las demas se devuelven igual y se dice cual no cargo.
export async function cargarReservas(estado) {
  const secciones = Object.keys(RESERVABLES);
  const respuestas = await Promise.allSettled(
    secciones.map((seccion) => api
      .get(`${CATALOGO[seccion].endpoint}/reservas`, { params: { estado: estado || undefined } })
      .then(({ data }) => data.map((r) => ({ ...r, seccionCatalogo: seccion }))))
  );
  return {
    reservas: respuestas.filter((r) => r.status === 'fulfilled').flatMap((r) => r.value),
    fallidas: secciones.filter((_, i) => respuestas[i].status === 'rejected'),
  };
}
