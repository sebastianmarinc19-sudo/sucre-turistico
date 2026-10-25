import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Logo from './Logo';
import { SECCIONES } from '../secciones';

function Encabezado() {
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);

  return (
    <>
      <header className="st-nav">
        <div className="container">
          <Logo />
          <nav aria-label="Secciones">
            <ul className="st-menu">
              {SECCIONES.map((s) => (
                <li key={s.ruta}>
                  <NavLink to={s.ruta}><i className={`fas ${s.icono}`} aria-hidden="true" /> {s.texto}</NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="st-nav-acciones">
            <Link to="/buscar" className="btn btn-outline-secondary btn-sm st-solo-escritorio" aria-label="Buscar">
              <i className="fas fa-magnifying-glass" aria-hidden="true" />
            </Link>
            <Link to="/admin" className="btn btn-outline-primary btn-sm st-solo-escritorio">
              <i className="fas fa-user" aria-hidden="true" /> Administrar
            </Link>
            <button type="button" className="st-hamburguesa" aria-label="Abrir menú" aria-expanded={abierto} onClick={() => setAbierto((a) => !a)}>
              <i className={`fas ${abierto ? 'fa-xmark' : 'fa-bars'}`} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <nav className={`st-menu-movil ${abierto ? 'abierto' : ''}`} aria-label="Menú">
        {SECCIONES.map((s) => (
          <NavLink key={s.ruta} to={s.ruta} onClick={cerrar}><i className={`fas ${s.icono}`} aria-hidden="true" /> {s.texto}</NavLink>
        ))}
        <NavLink to="/buscar" onClick={cerrar}><i className="fas fa-magnifying-glass" aria-hidden="true" /> Buscar</NavLink>
        <NavLink to="/admin" onClick={cerrar}><i className="fas fa-user" aria-hidden="true" /> Administrar</NavLink>
      </nav>
    </>
  );
}

export default Encabezado;
