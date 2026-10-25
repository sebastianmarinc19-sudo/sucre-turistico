import { imagenDe } from '../imagenes';

const ETIQUETAS_TIPO = {
  hotel: 'Hotel',
  hostal: 'Hostal',
  posada: 'Posada',
  cabana: 'Cabaña',
  camping: 'Camping',
};

function TarjetaAlojamiento({ alojamiento }) {
  const { nombre, municipio, tipo, descripcion, precio_noche, capacidad, estrellas, servicios } = alojamiento;

  return (
    <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
      <article className="st-card">
        <div className="st-card-img">
          <img src={imagenDe(alojamiento, tipo)} alt={nombre} loading="lazy" />
          {tipo && <span className="st-badge">{ETIQUETAS_TIPO[tipo] || tipo}</span>}
        </div>
        <div className="st-card-body">
          <h3 className="st-card-title">{nombre}</h3>
          <p className="st-card-lugar"><i className="fas fa-location-dot" aria-hidden="true" /> {municipio}, Sucre</p>
          {descripcion && <p className="st-card-desc">{descripcion}</p>}
          {Array.isArray(servicios) && servicios.length > 0 && (
            <p className="st-card-extra">{servicios.map((s) => s.replace(/_/g, ' ')).join(' · ')}</p>
          )}
        </div>
        <div className="st-card-footer">
          <span>
            {estrellas > 0 && <span className="st-estrellas" aria-label={`${estrellas} estrellas`}>{'★'.repeat(estrellas)}</span>}
            {capacidad && <span className="ms-2"><i className="fas fa-user-group" aria-hidden="true" /> {capacidad}</span>}
          </span>
          {precio_noche != null && (
            <span className="st-precio">${Number(precio_noche).toLocaleString('es-CO')}<small>/noche</small></span>
          )}
        </div>
      </article>
    </div>
  );
}

export default TarjetaAlojamiento;
