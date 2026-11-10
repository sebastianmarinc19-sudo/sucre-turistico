import { Building2, CalendarCheck, ExternalLink, KeyRound, LogOut, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, NavLink, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import api, { mensajeDeError } from '../api/client';
import { cerrarSesion, esSuperadmin, usuarioActual } from '../api/sesion';
import { CATALOGO } from '../catalogo';
import { ENTIDADES } from './entidades';
import Negocios from './Negocios';
import Reservas from './Reservas';
import { cargarReservas } from './reservasApi';
import TablaCrud from './TablaCrud';

// Lo que ve cada rol: el superadmin todo, mas las cuentas de los negocios; un
// negocio, todo menos los destinos (esos son informacion turistica general).
const entidadesDe = (usuario) => (esSuperadmin(usuario) ? ENTIDADES : ENTIDADES.filter((e) => e.seccion !== 'destinos'));

// Cuantos registros hay en cada entidad para quien mira (con panel=1: el
// negocio cuenta solo los suyos). Se vuelve a pedir tras cada cambio.
function useConteos(entidades) {
  const [conteos, setConteos] = useState({});
  const [version, setVersion] = useState(0);
  const claves = entidades.map((e) => e.clave).join(',');
  useEffect(() => {
    let cancelado = false;
    for (const e of ENTIDADES.filter((x) => claves.split(',').includes(x.clave))) {
      api.get(e.endpoint, { params: { panel: 1 } })
        .then(({ data }) => { if (!cancelado) setConteos((c) => ({ ...c, [e.clave]: data.length })); })
        .catch(() => { if (!cancelado) setConteos((c) => ({ ...c, [e.clave]: null })); });
    }
    return () => { cancelado = true; };
  }, [version, claves]);
  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  return [conteos, recargar];
}

function Panel() {
  const navigate = useNavigate();
  const { entidad: clave } = useParams();
  const usuario = usuarioActual();
  const entidades = entidadesDe(usuario);
  const [reindexando, setReindexando] = useState(false);
  const [conteos, recargarConteos] = useConteos(entidades);
  const reindexPendiente = useRef(null);

  // Reservas por atender, para el contador de la tarjeta "Reservas".
  const [pendientes, setPendientes] = useState(null);
  const [versionReservas, setVersionReservas] = useState(0);
  const recargarPendientes = useCallback(() => setVersionReservas((v) => v + 1), []);
  const puedeVerReservas = Boolean(usuario && !usuario.debe_cambiar_password);
  useEffect(() => {
    if (!puedeVerReservas) return undefined;
    let cancelado = false;
    cargarReservas('pendiente')
      .then(({ reservas }) => { if (!cancelado) setPendientes(reservas.length); })
      .catch(() => {});
    return () => { cancelado = true; };
  }, [versionReservas, puedeVerReservas]);

  // El indice del buscador no se entera solo de lo que se crea, edita, publica
  // u oculta: tras cada cambio se actualiza en segundo plano (agrupando los
  // cambios seguidos), sin molestar si falla.
  const alCambiar = useCallback(() => {
    recargarConteos();
    clearTimeout(reindexPendiente.current);
    reindexPendiente.current = setTimeout(() => { api.post('/api/buscador/reindexar').catch(() => {}); }, 3000);
  }, [recargarConteos]);
  useEffect(() => () => clearTimeout(reindexPendiente.current), []);

  if (!usuario) return <Navigate to="/admin/login" replace />;
  // Con contrasena temporal, primero hay que crear una propia.
  if (usuario.debe_cambiar_password) return <Navigate to="/admin/cambiar-clave" replace />;

  const super_ = esSuperadmin(usuario);
  const enNegocios = clave === 'negocios' && super_;
  const enReservas = clave === 'reservas';
  const entidad = entidades.find((e) => e.clave === clave);
  if (!entidad && !enNegocios && !enReservas) return <Navigate to={`/admin/${entidades[0].clave}`} replace />;

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
          <p className="st-panel-saludo">{super_ ? 'Superadministrador' : 'Mi negocio'}</p>
          <h1>Hola, {usuario.nombre}</h1>
        </div>
        <div className="st-panel-acciones">
          <Link to="/" className="btn btn-light btn-sm"><ExternalLink size={15} aria-hidden="true" /> Ver sitio</Link>
          <button type="button" className="btn btn-light btn-sm" onClick={actualizarBuscador} disabled={reindexando}>
            <RefreshCw size={15} className={reindexando ? 'st-girando' : ''} aria-hidden="true" /> {reindexando ? 'Actualizando…' : 'Actualizar buscador'}
          </button>
          <Link to="/admin/cambiar-clave" className="btn btn-light btn-sm"><KeyRound size={15} aria-hidden="true" /> Contraseña</Link>
          <button type="button" className="btn btn-light btn-sm" onClick={salir}><LogOut size={15} aria-hidden="true" /> Salir</button>
        </div>
      </header>

      {!super_ && (
        <p className="st-panel-ayuda">
          Aquí manejas la información de tu negocio: crea tus fichas, mantén al día precios y fotos, y usa el
          interruptor <strong>“En el sitio”</strong> para mostrarlas u ocultarlas a los turistas.
        </p>
      )}

      {/* Las tarjetas de resumen son tambien la navegacion entre entidades. */}
      <nav className="st-resumen" aria-label="Entidades">
        {entidades.map((e) => {
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
        <NavLink to="/admin/reservas" className="st-resumen-tarjeta">
          <span className="st-resumen-icono st-con-contador">
            <CalendarCheck size={22} aria-hidden="true" />
            {pendientes > 0 && <span className="st-contador" aria-label={`${pendientes} pendientes`}>{pendientes}</span>}
          </span>
          <span><strong>{pendientes == null ? '…' : pendientes}</strong><small>Reservas pendientes</small></span>
        </NavLink>
        {super_ && (
          <NavLink to="/admin/negocios" className="st-resumen-tarjeta">
            <span className="st-resumen-icono"><Building2 size={22} aria-hidden="true" /></span>
            <span><strong>Cuentas</strong><small>Negocios</small></span>
          </NavLink>
        )}
      </nav>

      {enNegocios && <Negocios />}
      {enReservas && <Reservas onCambio={recargarPendientes} />}
      {entidad && <TablaCrud key={entidad.clave} entidad={entidad} usuario={usuario} onCambio={alCambiar} />}
    </div>
  );
}

export default Panel;
