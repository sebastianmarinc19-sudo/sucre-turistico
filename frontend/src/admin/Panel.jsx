import { ExternalLink, LogOut, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, NavLink, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import api, { mensajeDeError } from '../api/client';
import { cerrarSesion, usuarioActual } from '../api/sesion';
import { CATALOGO } from '../catalogo';
import { ENTIDADES } from './entidades';
import TablaCrud from './TablaCrud';

// Cuantos registros activos hay en cada entidad, para las tarjetas de resumen.
// Se vuelve a pedir cada vez que la tabla crea, edita o borra algo.
function useConteos() {
  const [conteos, setConteos] = useState({});
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let cancelado = false;
    for (const e of ENTIDADES) {
      api.get(e.endpoint)
        .then(({ data }) => { if (!cancelado) setConteos((c) => ({ ...c, [e.clave]: data.length })); })
        .catch(() => { if (!cancelado) setConteos((c) => ({ ...c, [e.clave]: null })); });
    }
    return () => { cancelado = true; };
  }, [version]);
  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  return [conteos, recargar];
}

function Panel() {
  const navigate = useNavigate();
  const { entidad: clave } = useParams();
  const usuario = usuarioActual();
  const [reindexando, setReindexando] = useState(false);
  const [conteos, recargarConteos] = useConteos();

  if (!usuario) return <Navigate to="/admin/login" replace />;

  const entidad = ENTIDADES.find((e) => e.clave === clave);
  if (!entidad) return <Navigate to={`/admin/${ENTIDADES[0].clave}`} replace />;

  // El indice del buscador no se entera solo de lo que se crea o edita aqui.
  async function actualizarBuscador() {
    setReindexando(true);
    try {
      const { data } = await api.post('/api/buscador/reindexar');
      toast.success(`Buscador actualizado: ${data.total} registros indexados.`);
    } catch (err) {
      toast.error('No se pudo actualizar el buscador', { description: mensajeDeError(err) });
    } finally {
      setReindexando(false);
    }
  }

  function salir() {
    cerrarSesion();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="st-panel">
      <header className="st-panel-encabezado">
        <div>
          <p className="st-panel-saludo">Panel de administración</p>
          <h1>Hola, {usuario.nombre}</h1>
        </div>
        <div className="st-panel-acciones">
          <Link to="/" className="btn btn-light btn-sm"><ExternalLink size={15} aria-hidden="true" /> Ver sitio</Link>
          <button type="button" className="btn btn-light btn-sm" onClick={actualizarBuscador} disabled={reindexando}>
            <RefreshCw size={15} className={reindexando ? 'st-girando' : ''} aria-hidden="true" /> {reindexando ? 'Actualizando…' : 'Actualizar buscador'}
          </button>
          <button type="button" className="btn btn-light btn-sm" onClick={salir}><LogOut size={15} aria-hidden="true" /> Salir</button>
        </div>
      </header>

      {/* Las tarjetas de resumen son tambien la navegacion entre entidades. */}
      <nav className="st-resumen" aria-label="Entidades">
        {ENTIDADES.map((e) => {
          const Icono = CATALOGO[e.seccion].icono;
          const n = conteos[e.clave];
          return (
            <NavLink key={e.clave} to={`/admin/${e.clave}`} className="st-resumen-tarjeta">
              <span className="st-resumen-icono"><Icono size={22} aria-hidden="true" /></span>
              <span>
                <strong>{n === undefined ? '…' : n ?? '—'}</strong>
                <small>{e.titulo}</small>
              </span>
            </NavLink>
          );
        })}
      </nav>

      <TablaCrud key={entidad.clave} entidad={entidad} onCambio={recargarConteos} />
    </div>
  );
}

export default Panel;
