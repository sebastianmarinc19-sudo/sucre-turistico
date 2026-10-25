import { Link } from 'react-router-dom';
import { categoriaDe, etiquetaDe, pesos, rutaDetalle } from '../catalogo';
import { imagenDe } from '../imagenes';
import Columna from './Columna';

function TarjetaAlojamiento({ alojamiento, columna }) {
  const { nombre, municipio, descripcion, precio_noche, capacidad, estrellas, servicios } = alojamiento;

  return (
    <Columna clase={columna}>
      <Link to={rutaDetalle('alojamiento', alojamiento)} className="st-card">
        <div className="st-card-img">
          <img src={imagenDe(alojamiento, categoriaDe('alojamiento', alojamiento))} alt="" loading="lazy" />
          <span className="st-badge">{etiquetaDe('alojamiento', alojamiento)}</span>
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
          {precio_noche != null && <span className="st-precio">{pesos(precio_noche)}<small>/noche</small></span>}
        </div>
      </Link>
    </Columna>
  );
}

export default TarjetaAlojamiento;
