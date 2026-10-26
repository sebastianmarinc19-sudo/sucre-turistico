import { MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { categoriaDe, etiquetaDe, RANGOS_PRECIO, rutaDetalle } from '../catalogo';
import { imagenDe } from '../imagenes';
import BotonFavorito from './BotonFavorito';
import Columna from './Columna';

function TarjetaRestaurante({ restaurante, columna }) {
  const { nombre, municipio, descripcion, rango_precio, direccion, telefono } = restaurante;
  const precio = RANGOS_PRECIO[rango_precio];

  return (
    <Columna clase={columna}>
      <div className="st-tarjeta">
        <Link to={rutaDetalle('gastronomia', restaurante)} className="st-card">
          <div className="st-card-img">
            <img src={imagenDe(restaurante, categoriaDe('gastronomia', restaurante))} alt="" loading="lazy" />
            <span className="st-badge">{etiquetaDe('gastronomia', restaurante)}</span>
          </div>
          <div className="st-card-body">
            <h3 className="st-card-title">{nombre}</h3>
            <p className="st-card-lugar"><MapPin size={13} aria-hidden="true" /> {municipio}, Sucre</p>
            {descripcion && <p className="st-card-desc">{descripcion}</p>}
            {(direccion || telefono) && (
              <p className="st-card-extra">
                {direccion && <><MapPin size={12} aria-hidden="true" /> {direccion} </>}
                {telefono && <><Phone size={12} aria-hidden="true" /> {telefono}</>}
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
        <BotonFavorito seccion="gastronomia" registro={restaurante} />
      </div>
    </Columna>
  );
}

export default TarjetaRestaurante;
