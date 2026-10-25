import { imagenDe } from '../imagenes';

const ETIQUETAS_TIPO = {
  acuatica: 'Acuática',
  cultural: 'Cultural',
  ecoturismo: 'Ecoturismo',
  aventura: 'Aventura',
  gastronomica: 'Gastronómica',
};

function TarjetaExperiencia({ experiencia }) {
  const { nombre, municipio, tipo, descripcion, precio, duracion_horas, operador } = experiencia;

  return (
    <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
      <article className="st-card">
        <div className="st-card-img">
          <img src={imagenDe(experiencia, tipo)} alt={nombre} loading="lazy" />
          {tipo && <span className="st-badge">{ETIQUETAS_TIPO[tipo] || tipo}</span>}
        </div>
        <div className="st-card-body">
          <h3 className="st-card-title">{nombre}</h3>
          <p className="st-card-lugar"><i className="fas fa-location-dot" aria-hidden="true" /> {municipio}, Sucre</p>
          {descripcion && <p className="st-card-desc">{descripcion}</p>}
          {operador && <p className="st-card-extra">Opera: {operador}</p>}
        </div>
        <div className="st-card-footer">
          <span>
            {duracion_horas != null && <><i className="fas fa-clock" aria-hidden="true" /> {Number(duracion_horas).toLocaleString('es-CO')} h</>}
          </span>
          {precio != null && <span className="st-precio">${Number(precio).toLocaleString('es-CO')}<small>/persona</small></span>}
        </div>
      </article>
    </div>
  );
}

export default TarjetaExperiencia;
