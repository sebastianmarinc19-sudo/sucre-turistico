import { imagenDe } from '../imagenes';

const ETIQUETAS_TIPO = {
  festival: 'Festival',
  feria: 'Feria',
  religioso: 'Religioso',
  cultural: 'Cultural',
  deportivo: 'Deportivo',
};

// La API manda "2026-08-14". Se arma a mediodia local para que la zona
// horaria no la corra al dia anterior.
const aFecha = (texto) => new Date(`${texto}T12:00:00`);
const formatear = (texto) => aFecha(texto).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

function rangoDeFechas(inicio, fin) {
  if (!fin || fin === inicio) return formatear(inicio);
  return `${formatear(inicio)} – ${formatear(fin)}`;
}

function TarjetaEvento({ evento }) {
  const { nombre, municipio, tipo, descripcion, fecha_inicio, fecha_fin, lugar, precio_entrada } = evento;
  const gratis = precio_entrada == null || Number(precio_entrada) === 0;
  const inicio = aFecha(fecha_inicio);

  return (
    <div className="col-12 col-xl-6">
      <article className="st-evento">
        <div className="st-evento-fecha" aria-hidden="true">
          <span className="st-evento-dia">{inicio.getDate()}</span>
          <span className="st-evento-mes">{inicio.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')}</span>
        </div>
        <img className="st-evento-img" src={imagenDe(evento, tipo)} alt="" loading="lazy" />
        <div className="st-evento-body">
          <p className="st-card-extra mb-0">{rangoDeFechas(fecha_inicio, fecha_fin)}</p>
          <h3 className="st-card-title">{nombre}</h3>
          <p className="st-card-lugar"><i className="fas fa-location-dot" aria-hidden="true" /> {lugar || municipio}</p>
          {descripcion && <p className="st-card-desc">{descripcion}</p>}
          <p className="d-flex gap-2 align-items-center mt-auto mb-0">
            {tipo && <span className="st-badge suave">{ETIQUETAS_TIPO[tipo] || tipo}</span>}
            <span className="st-card-extra">
              {gratis ? 'Entrada libre' : `Entrada $${Number(precio_entrada).toLocaleString('es-CO')}`}
            </span>
          </p>
        </div>
      </article>
    </div>
  );
}

export default TarjetaEvento;
