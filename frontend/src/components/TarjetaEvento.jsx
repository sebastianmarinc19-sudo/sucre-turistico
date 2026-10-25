const ETIQUETAS_TIPO = {
  festival: 'Festival',
  feria: 'Feria',
  religioso: 'Religioso',
  cultural: 'Cultural',
  deportivo: 'Deportivo',
};

// La API manda "2026-08-14". Se arma la fecha a mediodia local para que la
// zona horaria no la corra al dia anterior.
function formatear(fecha) {
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

function rangoDeFechas(inicio, fin) {
  if (!fin || fin === inicio) return formatear(inicio);
  return `${formatear(inicio)} – ${formatear(fin)}`;
}

function TarjetaEvento({ evento }) {
  const { nombre, municipio, tipo, descripcion, imagen_url, fecha_inicio, fecha_fin, lugar, precio_entrada } = evento;
  const gratis = precio_entrada == null || Number(precio_entrada) === 0;

  return (
    <div className="col-12 col-md-6 col-lg-4">
      <article className="card h-100 shadow-sm">
        {imagen_url && (
          <img
            src={imagen_url}
            className="card-img-top"
            alt={nombre}
            style={{ height: '180px', objectFit: 'cover' }}
          />
        )}
        <div className="card-body d-flex flex-column">
          <p className="small fw-semibold mb-1">{rangoDeFechas(fecha_inicio, fecha_fin)}</p>
          <h3 className="card-title h5">{nombre}</h3>
          <p className="text-muted small mb-2">
            {municipio}
            {tipo && <span className="badge text-bg-light ms-2">{ETIQUETAS_TIPO[tipo] || tipo}</span>}
          </p>
          {descripcion && <p className="card-text small">{descripcion}</p>}
          <p className="mt-auto mb-0 small text-muted">
            {lugar && <span>{lugar} · </span>}
            <span>{gratis ? 'Entrada libre' : `$${Number(precio_entrada).toLocaleString('es-CO')}`}</span>
          </p>
        </div>
      </article>
    </div>
  );
}

export default TarjetaEvento;
