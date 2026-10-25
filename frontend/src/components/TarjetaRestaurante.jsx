import { Link } from 'react-router-dom';
import { categoriaDe, etiquetaDe, RANGOS_PRECIO, rutaDetalle } from '../catalogo';
import { imagenDe } from '../imagenes';
import Columna from './Columna';

function TarjetaRestaurante({ restaurante, columna }) {
  const { nombre, municipio, descripcion, rango_precio, direccion, telefono } = restaurante;
  const precio = RANGOS_PRECIO[rango_precio];

  return (
    <Columna clase={columna}>
      <Link to={rutaDetalle('gastronomia', restaurante)} className="st-card">
        <div className="st-card-img">
          <img src={imagenDe(restaurante, categoriaDe('gastronomia', restaurante))} alt="" loading="lazy" />
          <span className="st-badge">{etiquetaDe('gastronomia', restaurante)}</span>
        </div>
        <div className="st-card-body">
          <h3 className="st-card-title">{nombre}</h3>
          <p className="st-card-lugar"><i className="fas fa-location-dot" aria-hidden="true" /> {municipio}, Sucre</p>
          {descripcion && <p className="st-card-desc">{descripcion}</p>}
          {(direccion || telefono) && (
            <p className="st-card-extra">
              {direccion && <><i className="fas fa-map-pin" aria-hidden="true" /> {direccion} </>}
              {telefono && <><i className="fas fa-phone" aria-hidden="true" /> {telefono}</>}
            </p>
          )}
        </div>
        {precio && (
          <div className="st-card-footer">
            <span>{precio.texto}</span>
            <span className="st-precio">{precio.simbolo}</span>
          </div>
        )}
      </Link>
    </Columna>
  );
}

export default TarjetaRestaurante;
