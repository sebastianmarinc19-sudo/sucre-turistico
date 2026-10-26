import { Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { categoriaDe, etiquetaDe, pesos, rutaDetalle } from '../catalogo';
import { imagenDe } from '../imagenes';
import Columna from './Columna';

function TarjetaExperiencia({ experiencia, columna }) {
  const { nombre, municipio, descripcion, precio, duracion_horas, operador } = experiencia;

  return (
    <Columna clase={columna}>
      <Link to={rutaDetalle('experiencias', experiencia)} className="st-card">
        <div className="st-card-img">
          <img src={imagenDe(experiencia, categoriaDe('experiencias', experiencia))} alt="" loading="lazy" />
          <span className="st-badge">{etiquetaDe('experiencias', experiencia)}</span>
        </div>
        <div className="st-card-body">
          <h3 className="st-card-title">{nombre}</h3>
          <p className="st-card-lugar"><MapPin size={13} aria-hidden="true" /> {municipio}, Sucre</p>
          {descripcion && <p className="st-card-desc">{descripcion}</p>}
          {operador && <p className="st-card-extra">Opera: {operador}</p>}
        </div>
        <div className="st-card-footer">
          <span>
            {duracion_horas != null && <><Clock size={13} aria-hidden="true" /> {Number(duracion_horas).toLocaleString('es-CO')} h</>}
          </span>
          {precio != null && <span className="st-precio">{pesos(precio)}<small>/persona</small></span>}
        </div>
      </Link>
    </Columna>
  );
}

export default TarjetaExperiencia;
