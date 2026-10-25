import { Navigate, NavLink, useNavigate, useParams } from 'react-router-dom';
import { cerrarSesion, usuarioActual } from '../api/sesion';
import { ENTIDADES } from './entidades';
import TablaCrud from './TablaCrud';

function Panel() {
  const navigate = useNavigate();
  const { entidad: clave } = useParams();
  const usuario = usuarioActual();

  if (!usuario) return <Navigate to="/admin/login" replace />;

  const entidad = ENTIDADES.find((e) => e.clave === clave);
  if (!entidad) return <Navigate to={`/admin/${ENTIDADES[0].clave}`} replace />;

  function salir() {
    cerrarSesion();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h1 className="h3 mb-0">Panel de administración</h1>
        <div className="small">
          <span className="text-muted me-2">{usuario.nombre}</span>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={salir}>Cerrar sesión</button>
        </div>
      </div>

      <ul className="nav nav-tabs mb-4">
        {ENTIDADES.map((e) => (
          <li className="nav-item" key={e.clave}>
            <NavLink to={`/admin/${e.clave}`} className="nav-link">{e.titulo}</NavLink>
          </li>
        ))}
      </ul>

      <TablaCrud key={entidad.clave} entidad={entidad} />
    </div>
  );
}

export default Panel;
