import { Link } from 'react-router-dom';
import Logo from './Logo';
import { SECCIONES } from '../secciones';

function PiePagina() {
  return (
    <footer className="st-footer">
      <div className="container">
        <div className="st-footer-grid">
          <div>
            <Logo />
            <p>Tu guía del Golfo de Morrosquillo: playas, alojamiento, gastronomía, experiencias y la agenda de eventos de Sucre en un solo lugar.</p>
          </div>
          <div>
            <h3>Explora</h3>
            <ul>
              {SECCIONES.map((s) => <li key={s.ruta}><Link to={s.ruta}>{s.texto}</Link></li>)}
            </ul>
          </div>
          <div>
            <h3>Herramientas</h3>
            <ul>
              <li><Link to="/buscar">Buscador</Link></li>
              <li><Link to="/admin">Administración</Link></li>
            </ul>
          </div>
          <div>
            <h3>Proyecto</h3>
            <ul>
              <li><a href="https://github.com/sebastianmarinc19-sudo/sucre-turistico" target="_blank" rel="noreferrer">Código en GitHub</a></li>
              <li><span className="text-white-50 small">Electiva Profesional II · UNIAJS</span></li>
            </ul>
          </div>
        </div>
        <div className="st-footer-base">
          <span>© {new Date().getFullYear()} Sucre Turístico</span>
          <span>Proyecto académico — Corporación Universitaria Antonio José de Sucre</span>
        </div>
      </div>
    </footer>
  );
}

export default PiePagina;
