import { imagenDe } from '../imagenes';

const ETIQUETAS_COCINA = {
  tipica: 'Típica',
  mariscos: 'Mariscos',
  internacional: 'Internacional',
  comida_rapida: 'Comida rápida',
  vegetariana: 'Vegetariana',
};

const ETIQUETAS_PRECIO = {
  economico: { simbolo: '$', texto: 'Económico' },
  medio: { simbolo: '$$', texto: 'Precio medio' },
  alto: { simbolo: '$$$', texto: 'Precio alto' },
};

function TarjetaRestaurante({ restaurante }) {
  const { nombre, municipio, tipo_cocina, descripcion, rango_precio, direccion, telefono } = restaurante;
  const precio = ETIQUETAS_PRECIO[rango_precio];

  return (
    <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
      <article className="st-card">
        <div className="st-card-img">
          <img src={imagenDe(restaurante, tipo_cocina)} alt={nombre} loading="lazy" />
          {tipo_cocina && <span className="st-badge">{ETIQUETAS_COCINA[tipo_cocina] || tipo_cocina}</span>}
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
      </article>
    </div>
  );
}

export default TarjetaRestaurante;
