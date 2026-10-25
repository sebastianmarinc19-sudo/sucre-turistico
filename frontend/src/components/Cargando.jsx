export function AvisoDespertando() {
  return (
    <p className="st-aviso-espera" role="status">
      <i className="fas fa-mug-hot" aria-hidden="true" /> Estamos despertando los servidores (son gratuitos y se duermen si nadie los usa). Puede tardar hasta medio minuto.
    </p>
  );
}

// Tarjetas "fantasma" con la forma de las reales mientras llegan los datos.
export function TarjetasEsqueleto({ cantidad = 4 }) {
  return (
    <div className="row g-4" aria-hidden="true">
      {Array.from({ length: cantidad }, (_, i) => (
        <div className="col-12 col-sm-6 col-lg-4 col-xl-3" key={i}>
          <div className="st-card">
            <div className="st-card-img st-esqueleto" />
            <div className="st-card-body">
              <div className="st-esqueleto st-esqueleto-linea" style={{ width: '70%' }} />
              <div className="st-esqueleto st-esqueleto-linea" style={{ width: '40%' }} />
              <div className="st-esqueleto st-esqueleto-linea" />
              <div className="st-esqueleto st-esqueleto-linea" style={{ width: '85%' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
