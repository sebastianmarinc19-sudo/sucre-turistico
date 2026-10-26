import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { categoriaDe, etiquetaDe, rutaDetalle } from '../catalogo';
import { imagenDe } from '../imagenes';
import BotonFavorito from './BotonFavorito';
import Columna from './Columna';

function TarjetaDestino({ destino, columna }) {
  const { nombre, municipio, descripcion } = destino;

  return (
    <Columna clase={columna}>
      <div className="st-tarjeta">
        <Link to={rutaDetalle('destinos', destino)} className="st-card">
          <div className="st-card-img">
            <img src={imagenDe(destino, categoriaDe('destinos', destino))} alt="" loading="lazy" />
            <span className="st-badge">{etiquetaDe('destinos', destino)}</span>
          </div>
          <div className="st-card-body">
            <h3 className="st-card-title">{nombre}</h3>
            <p className="st-card-lugar"><MapPin size={13} aria-hidden="true" /> {municipio}, Sucre</p>
            {descripcion && <p className="st-card-desc">{descripcion}</p>}
          </div>
        </Link>
        <BotonFavorito seccion="destinos" registro={destino} />
      </div>
    </Columna>
  );
}

export default TarjetaDestino;
