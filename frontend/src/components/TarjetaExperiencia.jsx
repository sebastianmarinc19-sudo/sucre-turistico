const ETIQUETAS_TIPO = {
  acuatica: 'Acuática',
  cultural: 'Cultural',
  ecoturismo: 'Ecoturismo',
  aventura: 'Aventura',
  gastronomica: 'Gastronómica',
};

// "4.0" -> "4 h", "1.5" -> "1,5 h"
function duracion(horas) {
  return `${Number(horas).toLocaleString('es-CO')} h`;
}

function TarjetaExperiencia({ experiencia }) {
  const { nombre, municipio, tipo, descripcion, imagen_url, precio, duracion_horas, operador } = experiencia;

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
          <h3 className="card-title h5">{nombre}</h3>
          <p className="text-muted small mb-2">
            {municipio}
            {tipo && <span className="badge text-bg-light ms-2">{ETIQUETAS_TIPO[tipo] || tipo}</span>}
          </p>
          {descripcion && <p className="card-text small">{descripcion}</p>}
          <p className="mt-auto mb-0 small">
            {precio != null && <strong>${Number(precio).toLocaleString('es-CO')}</strong>}
            {precio != null && <span className="text-muted"> / persona</span>}
            {duracion_horas != null && <span className="text-muted"> · {duracion(duracion_horas)}</span>}
          </p>
          {operador && <p className="mb-0 small text-muted">Opera: {operador}</p>}
        </div>
      </article>
    </div>
  );
}

export default TarjetaExperiencia;
