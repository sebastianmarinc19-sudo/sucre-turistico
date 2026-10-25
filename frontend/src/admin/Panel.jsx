import { useState } from 'react';
import { Navigate, NavLink, useNavigate, useParams } from 'react-router-dom';
import api, { mensajeDeError } from '../api/client';
import { cerrarSesion, usuarioActual } from '../api/sesion';
import { ENTIDADES } from './entidades';
import TablaCrud from './TablaCrud';

function Panel() {
  const navigate = useNavigate();
  const { entidad: clave } = useParams();
  const usuario = usuarioActual();
  const [reindexando, setReindexando] = useState(false);
  const [avisoBuscador, setAvisoBuscador] = useState(null);

  if (!usuario) return <Navigate to="/admin/login" replace />;

  // El indice del buscador no se entera solo de lo que se crea o edita aqui.
  async function actualizarBuscador() {
    setReindexando(true);
    setAvisoBuscador(null);
    try {
      const { data } = await api.post('/api/buscador/reindexar');
      setAvisoBuscador({ ok: true, texto: `Buscador actualizado: ${data.total} registros indexados.` });
    } catch (err) {
      setAvisoBuscador({ ok: false, texto: mensajeDeError(err) });
    } finally {
      setReindexando(false);
    }
  }

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
        <div className="small d-flex flex-wrap align-items-center gap-2">
          <span className="text-muted">{usuario.nombre}</span>
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={actualizarBuscador} disabled={reindexando}>
            {reindexando ? 'Actualizando…' : 'Actualizar buscador'}
          </button>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={salir}>Cerrar sesión</button>
        </div>
      </div>

      {avisoBuscador && (
        <div className={`alert ${avisoBuscador.ok ? 'alert-success' : 'alert-warning'} py-2 small`} role="status">{avisoBuscador.texto}</div>
      )}

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
