const ETIQUETAS_TIPO = {
  hotel: 'Hotel',
  hostal: 'Hostal',
  posada: 'Posada',
  cabana: 'Cabaña',
  camping: 'Camping',
};

function TarjetaAlojamiento({ alojamiento }) {
  const { nombre, municipio, tipo, descripcion, imagen_url, precio_noche, capacidad, estrellas, servicios } = alojamiento;

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
            {estrellas > 0 && <span className="ms-2" aria-label={`${estrellas} estrellas`}>{'★'.repeat(estrellas)}</span>}
          </p>
          {descripcion && <p className="card-text small">{descripcion}</p>}
          {Array.isArray(servicios) && servicios.length > 0 && (
            <p className="small text-muted mb-2">{servicios.map((s) => s.replace(/_/g, ' ')).join(' · ')}</p>
          )}
          <p className="mt-auto mb-0 small">
            {precio_noche != null && (
              <strong>${Number(precio_noche).toLocaleString('es-CO')}</strong>
            )}
            {precio_noche != null && <span className="text-muted"> / noche</span>}
            {capacidad && <span className="text-muted"> · hasta {capacidad} personas</span>}
          </p>
        </div>
      </article>
    </div>
  );
}

export default TarjetaAlojamiento;
