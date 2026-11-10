import { Copy, KeyRound, Plus, RefreshCw, UserCheck, UserX } from 'lucide-react';
import { useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { toast } from 'sonner';
import api, { mensajeDeError } from '../api/client';
import { generarTemporal } from '../api/sesion';

// Cuentas de los negocios (solo superadmin). El superadmin crea la cuenta con
// una contrasena temporal y se la pasa al negocio; al primer ingreso, el
// sistema le pide cambiarla. Ver docs/sql/06-roles-negocios.sql.

const URL_PANEL = `${window.location.origin}/admin/login`;

// Muestra los datos de acceso una sola vez, listos para copiar y enviar.
function DatosDeAcceso({ datos, onCerrar }) {
  if (!datos) return null;
  const texto = `Acceso al panel de Sucre Turístico\n${URL_PANEL}\nCorreo: ${datos.email}\nContraseña temporal: ${datos.password}\n(Al entrar te pedirá crear una contraseña propia.)`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success('Datos copiados', { description: 'Pégalos en WhatsApp o en un correo para el negocio.' });
    } catch {
      toast.error('No se pudo copiar: selecciona el texto y cópialo a mano.');
    }
  }

  return (
    <Modal show onHide={onCerrar} centered>
      <Modal.Header closeButton><Modal.Title as="h3" className="h5">Datos de acceso de {datos.nombre}</Modal.Title></Modal.Header>
      <Modal.Body>
        <p className="small text-muted">Envíaselos al negocio. La contraseña temporal no se vuelve a mostrar: si se pierde, usa "Restablecer".</p>
        <pre className="st-datos-acceso">{texto}</pre>
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn btn-light" onClick={onCerrar}>Cerrar</button>
        <button type="button" className="btn btn-primary" onClick={copiar}><Copy size={16} aria-hidden="true" /> Copiar datos</button>
      </Modal.Footer>
    </Modal>
  );
}

function Negocios() {
  const [cuentas, setCuentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  const [nueva, setNueva] = useState(null); // { nombre, email, password } mientras se llena
  const [guardando, setGuardando] = useState(false);
  const [errorNueva, setErrorNueva] = useState(null);
  const [acceso, setAcceso] = useState(null); // datos para mostrar una vez
  const [porRestablecer, setPorRestablecer] = useState(null);

  useEffect(() => {
    let cancelado = false;
    api.get('/api/auth/usuarios')
      .then(({ data }) => { if (!cancelado) { setCuentas(data); setError(null); } })
      .catch((err) => { if (!cancelado) setError(mensajeDeError(err)); })
      .finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, [version]);

  const recargar = () => setVersion((v) => v + 1);

  async function crear(e) {
    e.preventDefault();
    setGuardando(true);
    setErrorNueva(null);
    try {
      await api.post('/api/auth/registro', { ...nueva, rol: 'negocio' });
      toast.success(`Cuenta creada para ${nueva.nombre}`);
      setAcceso(nueva);
      setNueva(null);
      recargar();
    } catch (err) {
      setErrorNueva(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(cuenta) {
    try {
      await api.patch(`/api/auth/usuarios/${cuenta.id}`, { activo: !cuenta.activo });
      toast.success(cuenta.activo ? `Se suspendió ${cuenta.nombre}` : `Se reactivó ${cuenta.nombre}`, {
        description: cuenta.activo ? 'No puede entrar y sus fichas dejaron de verse en el sitio.' : 'Sus fichas publicadas vuelven a verse.',
      });
      recargar();
    } catch (err) {
      toast.error('No se pudo cambiar el estado', { description: mensajeDeError(err) });
    }
  }

  async function restablecer() {
    const password = generarTemporal();
    try {
      await api.post(`/api/auth/usuarios/${porRestablecer.id}/restablecer`, { password });
      setAcceso({ nombre: porRestablecer.nombre, email: porRestablecer.email, password });
      setPorRestablecer(null);
      recargar();
    } catch (err) {
      toast.error('No se pudo restablecer', { description: mensajeDeError(err) });
    }
  }

  const negocios = cuentas.filter((c) => c.rol === 'negocio');

  return (
    <section className="st-tabla-tarjeta">
      <div className="st-tabla-barra">
        <div>
          <h2>Negocios</h2>
          <p>Hoteles, restaurantes y operadores con acceso al panel. Cada uno maneja solo sus fichas.</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => { setErrorNueva(null); setNueva({ nombre: '', email: '', password: generarTemporal() }); }}>
          <Plus size={16} aria-hidden="true" /> Nueva cuenta de negocio
        </button>
      </div>

      {cargando && <div className="text-center py-5"><div className="spinner-border" role="status"><span className="visually-hidden">Cargando…</span></div></div>}
      {!cargando && error && <div className="alert alert-warning m-3" role="alert">{error}</div>}
      {!cargando && !error && negocios.length === 0 && (
        <p className="text-center text-muted py-5 mb-0">Todavía no hay cuentas de negocio. Crea la primera con el botón de arriba.</p>
      )}

      {!cargando && !error && negocios.length > 0 && (
        <div className="table-responsive">
          <table className="table st-tabla align-middle mb-0">
            <thead>
              <tr><th scope="col">Negocio</th><th scope="col">Estado</th><th scope="col">Contraseña</th><th scope="col" className="text-end">Acciones</th></tr>
            </thead>
            <tbody>
              {negocios.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.nombre}</strong><br /><small className="text-muted">{c.email}</small></td>
                  <td>{c.activo ? <span className="st-estado publicado">Activa</span> : <span className="st-estado oculto">Suspendida</span>}</td>
                  <td>{c.debe_cambiar_password ? <span className="st-badge suave">Temporal, sin cambiar</span> : <span className="text-muted small">Propia</span>}</td>
                  <td className="text-end text-nowrap">
                    <button type="button" className="st-accion" title="Restablecer contraseña" aria-label={`Restablecer contraseña de ${c.nombre}`} onClick={() => setPorRestablecer(c)}><KeyRound size={17} /></button>
                    <button type="button" className={`st-accion ${c.activo ? 'peligro' : ''}`} title={c.activo ? 'Suspender' : 'Reactivar'}
                      aria-label={`${c.activo ? 'Suspender' : 'Reactivar'} ${c.nombre}`} onClick={() => cambiarEstado(c)}>
                      {c.activo ? <UserX size={17} /> : <UserCheck size={17} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal show={Boolean(nueva)} onHide={() => !guardando && setNueva(null)} centered>
        {nueva && (
          <form onSubmit={crear} className="d-contents">
            <Modal.Header closeButton><Modal.Title as="h3" className="h5">Nueva cuenta de negocio</Modal.Title></Modal.Header>
            <Modal.Body>
              <div className="mb-3">
                <label className="form-label small" htmlFor="neg-nombre">Nombre del negocio <span className="text-danger">*</span></label>
                <input id="neg-nombre" className="form-control" required value={nueva.nombre} onChange={(e) => setNueva({ ...nueva, nombre: e.target.value })} placeholder="Hotel Mar de Coveñas" />
              </div>
              <div className="mb-3">
                <label className="form-label small" htmlFor="neg-email">Correo con el que va a entrar <span className="text-danger">*</span></label>
                <input id="neg-email" type="email" className="form-control" required value={nueva.email} onChange={(e) => setNueva({ ...nueva, email: e.target.value })} />
              </div>
              <div>
                <label className="form-label small" htmlFor="neg-clave">Contraseña temporal</label>
                <div className="input-group">
                  <input id="neg-clave" className="form-control font-monospace" required minLength={8} value={nueva.password} onChange={(e) => setNueva({ ...nueva, password: e.target.value })} />
                  <button type="button" className="btn btn-light" title="Generar otra" aria-label="Generar otra contraseña" onClick={() => setNueva({ ...nueva, password: generarTemporal() })}><RefreshCw size={16} /></button>
                </div>
                <p className="small text-muted mt-1 mb-0">El negocio la cambia por una propia en su primer ingreso.</p>
              </div>
              {errorNueva && <div className="alert alert-warning small mt-3 mb-0" role="alert">{errorNueva}</div>}
            </Modal.Body>
            <Modal.Footer>
              <button type="button" className="btn btn-light" onClick={() => setNueva(null)} disabled={guardando}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={guardando}>{guardando ? 'Creando…' : 'Crear cuenta'}</button>
            </Modal.Footer>
          </form>
        )}
      </Modal>

      <Modal show={Boolean(porRestablecer)} onHide={() => setPorRestablecer(null)} centered>
        <Modal.Header closeButton><Modal.Title as="h3" className="h5">¿Restablecer la contraseña?</Modal.Title></Modal.Header>
        <Modal.Body>
          Se le dará a <strong>{porRestablecer?.nombre}</strong> una contraseña temporal nueva y la actual dejará de funcionar.
          Al entrar, tendrá que crear una propia.
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-light" onClick={() => setPorRestablecer(null)}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={restablecer}>Restablecer</button>
        </Modal.Footer>
      </Modal>

      <DatosDeAcceso datos={acceso} onCerrar={() => setAcceso(null)} />
    </section>
  );
}

export default Negocios;
