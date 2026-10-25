// La API manda las fechas como "2026-08-14". Se arman a mediodia local para
// que la zona horaria no las corra al dia anterior.
export const aFecha = (texto) => new Date(`${texto}T12:00:00`);

const formatear = (texto) => aFecha(texto).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

export function rangoDeFechas(inicio, fin) {
  if (!fin || fin === inicio) return formatear(inicio);
  return `${formatear(inicio)} – ${formatear(fin)}`;
}

export const mesCorto = (fecha) => fecha.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');

// Fecha local en formato AAAA-MM-DD, el que espera la API.
export function hoy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
