import { Search, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Logo from './Logo';
import { SECCIONES } from '../secciones';

// En el celular el menu va abajo, como en una app (ver BarraInferior.jsx):
// aqui arriba solo quedan el logo y, en pantallas grandes, las secciones.
function Encabezado() {
  // Al bajar, el encabezado se vuelve translucido y gana sombra.
  const [conScroll, setConScroll] = useState(false);
  useEffect(() => {
    const alMover = () => setConScroll(window.scrollY > 8);
    alMover();
    window.addEventListener('scroll', alMover, { passive: true });
    return () => window.removeEventListener('scroll', alMover);
  }, []);

  return (
    <header className={`st-nav ${conScroll ? 'con-scroll' : ''}`}>
      <div className="container">
        <Logo />
        <nav aria-label="Secciones">
          <ul className="st-menu">
            {SECCIONES.map(({ ruta, texto, icono: Icono }) => (
              <li key={ruta}>
                <NavLink to={ruta}><Icono size={16} aria-hidden="true" /> {texto}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="st-nav-acciones">
          <Link to="/buscar" className="st-boton-icono" aria-label="Buscar">
            <Search size={18} aria-hidden="true" />
          </Link>
          <Link to="/admin" className="btn btn-primary btn-sm st-solo-escritorio">
            <UserRound size={16} aria-hidden="true" /> Administrar
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Encabezado;
