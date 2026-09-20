// Muestra un destino. Recibe los datos por props y no sabe de donde salieron:
// eso lo hace reutilizable y facil de probar.
const ETIQUETAS_CATEGORIA = {
  playa: 'Playa',
  atractivo_natural: 'Atractivo natural',
  atractivo_cultural: 'Atractivo cultural',
  lugar_turistico: 'Lugar turistico',
};

function TarjetaDestino({ destino }) {
  const { nombre, municipio, categoria, descripcion, imagen_url } = destino;

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
            {categoria && (
              <span className="badge text-bg-light ms-2">
                {ETIQUETAS_CATEGORIA[categoria] || categoria}
              </span>
            )}
          </p>
          {descripcion && <p className="card-text small">{descripcion}</p>}
        </div>
      </article>
    </div>
  );
}

export default TarjetaDestino;
