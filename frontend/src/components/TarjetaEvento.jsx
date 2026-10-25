import { Link } from 'react-router-dom';
import { categoriaDe, etiquetaDe, pesos, rutaDetalle } from '../catalogo';
import { aFecha, mesCorto, rangoDeFechas } from '../fechas';
import { imagenDe } from '../imagenes';
import Columna from './Columna';

function TarjetaEvento({ evento, columna = 'col-12 col-xl-6' }) {
  const { nombre, municipio, descripcion, fecha_inicio, fecha_fin, lugar, precio_entrada } = evento;
  const gratis = precio_entrada == null || Number(precio_entrada) === 0;
  const inicio = aFecha(fecha_inicio);

  return (
    <Columna clase={columna}>
      <Link to={rutaDetalle('eventos', evento)} className="st-evento">
        <div className="st-evento-fecha" aria-hidden="true">
          <span className="st-evento-dia">{inicio.getDate()}</span>
          <span className="st-evento-mes">{mesCorto(inicio)}</span>
        </div>
        <img className="st-evento-img" src={imagenDe(evento, categoriaDe('eventos', evento))} alt="" loading="lazy" />
        <div className="st-evento-body">
          <p className="st-card-extra mb-0">{rangoDeFechas(fecha_inicio, fecha_fin)}</p>
          <h3 className="st-card-title">{nombre}</h3>
          <p className="st-card-lugar"><i className="fas fa-location-dot" aria-hidden="true" /> {lugar || municipio}</p>
          {descripcion && <p className="st-card-desc">{descripcion}</p>}
          <p className="d-flex gap-2 align-items-center mt-auto mb-0">
            <span className="st-badge suave">{etiquetaDe('eventos', evento)}</span>
            <span className="st-card-extra">{gratis ? 'Entrada libre' : `Entrada ${pesos(precio_entrada)}`}</span>
          </p>
        </div>
      </Link>
    </Columna>
  );
}

export default TarjetaEvento;
