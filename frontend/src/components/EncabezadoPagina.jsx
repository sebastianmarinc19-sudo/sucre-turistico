import { Link } from 'react-router-dom';

function EncabezadoPagina({ titulo, descripcion }) {
  return (
    <div className="st-page-header">
      <div className="container">
        <nav className="st-migas" aria-label="Ruta de navegación">
          <Link to="/">Inicio</Link> <span aria-hidden="true">›</span> {titulo}
        </nav>
        <h1>{titulo}</h1>
        {descripcion && <p>{descripcion}</p>}
      </div>
    </div>
  );
}

export default EncabezadoPagina;
