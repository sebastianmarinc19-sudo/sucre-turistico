const ETIQUETAS_COCINA = {
  tipica: 'Típica',
  mariscos: 'Mariscos',
  internacional: 'Internacional',
  comida_rapida: 'Comida rápida',
  vegetariana: 'Vegetariana',
};

const ETIQUETAS_PRECIO = {
  economico: '$ Económico',
  medio: '$$ Medio',
  alto: '$$$ Alto',
};

function TarjetaRestaurante({ restaurante }) {
  const { nombre, municipio, tipo_cocina, descripcion, imagen_url, rango_precio, direccion, telefono } = restaurante;

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
            {tipo_cocina && (
              <span className="badge text-bg-light ms-2">{ETIQUETAS_COCINA[tipo_cocina] || tipo_cocina}</span>
            )}
          </p>
          {descripcion && <p className="card-text small">{descripcion}</p>}
          <p className="mt-auto mb-0 small text-muted">
            {rango_precio && <span>{ETIQUETAS_PRECIO[rango_precio] || rango_precio}</span>}
            {direccion && <span> · {direccion}</span>}
            {telefono && <span> · {telefono}</span>}
          </p>
        </div>
      </article>
    </div>
  );
}

export default TarjetaRestaurante;
