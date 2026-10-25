import { imagenDe } from '../imagenes';

const ETIQUETAS_CATEGORIA = {
  playa: 'Playa',
  atractivo_natural: 'Atractivo natural',
  atractivo_cultural: 'Atractivo cultural',
  lugar_turistico: 'Lugar turístico',
};

function TarjetaDestino({ destino }) {
  const { nombre, municipio, categoria, descripcion } = destino;

  return (
    <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
      <article className="st-card">
        <div className="st-card-img">
          <img src={imagenDe(destino, categoria)} alt={nombre} loading="lazy" />
          {categoria && <span className="st-badge">{ETIQUETAS_CATEGORIA[categoria] || categoria}</span>}
        </div>
        <div className="st-card-body">
          <h3 className="st-card-title">{nombre}</h3>
          <p className="st-card-lugar"><i className="fas fa-location-dot" aria-hidden="true" /> {municipio}, Sucre</p>
          {descripcion && <p className="st-card-desc">{descripcion}</p>}
        </div>
      </article>
    </div>
  );
}

export default TarjetaDestino;
