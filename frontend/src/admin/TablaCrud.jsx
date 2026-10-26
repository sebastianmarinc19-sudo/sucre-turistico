import { Eye, ImageOff, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import api, { mensajeDeError } from '../api/client';
import { CATALOGO, categoriaDe, pesos, RANGOS_PRECIO, rutaDetalle } from '../catalogo';
import { rangoDeFechas } from '../fechas';
import { imagenDe } from '../imagenes';

// Pasa una fila de la API a los valores del formulario (todo como texto).
function aFormulario(campos, fila) {
  const valores = {};
  for (const c of campos) {
    const v = fila?.[c.nombre];
    if (c.tipo === 'lista') valores[c.nombre] = Array.isArray(v) ? v.join(', ') : '';
    else valores[c.nombre] = v == null ? '' : String(v);
  }
  return valores;
}

// Pasa los valores del formulario al cuerpo que esperan los microservicios.
function aCuerpo(campos, valores) {
  const cuerpo = {};
  for (const c of campos) {
    const v = valores[c.nombre].trim();
    if (c.tipo === 'lista') cuerpo[c.nombre] = v ? v.split(',').map((s) => s.trim()).filter(Boolean) : null;
    else if (c.tipo === 'numero' || c.tipo === 'municipio') cuerpo[c.nombre] = v === '' ? null : Number(v);
    else cuerpo[c.nombre] = v === '' ? null : v;
  }
  return cuerpo;
}

// Como se ve cada celda: etiquetas en vez de claves, precios con formato.
function Celda({ seccion, columna, fila }) {
  const valor = fila[columna];
  if (valor == null || valor === '') return <span className="text-muted">—</span>;
  if (columna === CATALOGO[seccion].campoCategoria) {
    return <span className="st-badge suave">{CATALOGO[seccion].etiquetas[valor] || valor}</span>;
  }
  if (columna === 'rango_precio') return RANGOS_PRECIO[valor]?.texto || valor;
  if (columna.startsWith('precio')) return pesos(valor);
  if (columna.startsWith('fecha')) return rangoDeFechas(valor);
  return valor;
}

function Campo({ campo, valor, onChange, municipios }) {
  const id = `campo-${campo.nombre}`;
  const comun = { id, value: valor, required: campo.obligatorio, onChange: (e) => onChange(campo.nombre, e.target.value) };

  let control;
  if (campo.tipo === 'textarea') {
    control = <textarea className="form-control" rows={3} {...comun} />;
  } else if (campo.tipo === 'opciones' || campo.tipo === 'municipio') {
    const lista = campo.tipo === 'municipio'
      ? municipios.map((m) => ({ valor: String(m.id), etiqueta: m.nombre }))
      : campo.opciones;
    control = (
      <select className="form-select" {...comun}>
        <option value="">Selecciona…</option>
        {lista.map((o) => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
      </select>
    );
  } else {
    const tipo = { numero: 'number', fecha: 'date' }[campo.tipo] || 'text';
    control = <input type={tipo} step={tipo === 'number' ? 'any' : undefined} min={tipo === 'number' ? 0 : undefined} className="form-control" {...comun} />;
  }

  return (
    <div className={campo.tipo === 'textarea' || campo.nombre === 'imagen_url' ? 'col-12' : 'col-12 col-md-6'}>
      <label className="form-label small" htmlFor={id}>
        {campo.etiqueta}{campo.obligatorio && <span className="text-danger"> *</span>}
      </label>
      {control}
    </div>
  );
}

// Vista previa de la URL de imagen que se esta escribiendo.
function VistaPrevia({ url }) {
  const [rota, setRota] = useState(false);
  if (!url) return null;
  return (
    <div className="col-12">
      <div className="st-vista-previa">
        {rota
          ? <span><ImageOff size={20} aria-hidden="true" /> No se pudo cargar esa imagen. Revisa que la URL sea pública y termine en una foto.</span>
          : <img key={url} src={url} alt="Vista previa" onError={() => setRota(true)} />}
      </div>
    </div>
  );
}

function TablaCrud({ entidad, onCambio }) {
  const { endpoint, columnas, campos, singular, titulo, seccion } = entidad;

  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [municipios, setMunicipios] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  // null = cerrado; { id, valores } = abierto (id null si es nuevo).
  const [formulario, setFormulario] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState(null);
  const [porBorrar, setPorBorrar] = useState(null);
  const [borrando, setBorrando] = useState(false);

  // Subirlo vuelve a pedir la lista (despues de crear, editar o eliminar).
  const [version, setVersion] = useState(0);
  const recargar = () => {
    setVersion((v) => v + 1);
    onCambio?.();
  };

  useEffect(() => {
    api.get(`${endpoint}/catalogos/municipios`)
      .then(({ data }) => setMunicipios(data))
      .catch(() => setMunicipios([]));
  }, [endpoint]);

  useEffect(() => {
    let cancelado = false;
    api.get(endpoint)
      .then(({ data }) => { if (!cancelado) { setFilas(data); setError(null); } })
      .catch((err) => { if (!cancelado) setError(mensajeDeError(err)); })
      .finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, [endpoint, version]);

  function abrir(fila) {
    setErrorFormulario(null);
    setFormulario({ id: fila?.id ?? null, valores: aFormulario(campos, fila) });
  }

  function cambiar(nombre, valor) {
    setFormulario((f) => ({ ...f, valores: { ...f.valores, [nombre]: valor } }));
  }

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    setErrorFormulario(null);
    try {
      const cuerpo = aCuerpo(campos, formulario.valores);
      if (formulario.id) await api.put(`${endpoint}/${formulario.id}`, cuerpo);
      else await api.post(endpoint, cuerpo);
      toast.success(formulario.id ? 'Cambios guardados' : `Se creó el ${singular}`, { description: cuerpo.nombre });
      setFormulario(null);
      recargar();
    } catch (err) {
      setErrorFormulario(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    setBorrando(true);
    try {
      await api.delete(`${endpoint}/${porBorrar.id}`);
      toast.success(`Se eliminó "${porBorrar.nombre}"`);
      setPorBorrar(null);
      recargar();
    } catch (err) {
      toast.error('No se pudo eliminar', { description: mensajeDeError(err) });
    } finally {
      setBorrando(false);
    }
  }

  const texto = busqueda.trim().toLowerCase();
  const visibles = texto
    ? filas.filter((f) => `${f.nombre} ${f.municipio}`.toLowerCase().includes(texto))
    : filas;
  // La primera columna (nombre) va junto a la foto; el resto, cada una en la suya.
  const otrasColumnas = columnas.filter((c) => c.nombre !== 'nombre' && c.nombre !== 'municipio');

  return (
    <section className="st-tabla-tarjeta">
      <div className="st-tabla-barra">
        <div>
          <h2>{titulo}</h2>
          <p>{cargando ? 'Cargando…' : `${filas.length} ${filas.length === 1 ? 'registro' : 'registros'}`}</p>
        </div>
        <div className="st-tabla-controles">
          <label className="st-busqueda">
            <Search size={16} aria-hidden="true" />
            <input type="search" placeholder={`Buscar en ${titulo.toLowerCase()}…`} aria-label={`Buscar en ${titulo}`}
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </label>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => abrir(null)}>
            <Plus size={16} aria-hidden="true" /> Nuevo {singular}
          </button>
        </div>
      </div>

      {cargando && (
        <div className="text-center py-5">
          <div className="spinner-border" role="status"><span className="visually-hidden">Cargando…</span></div>
        </div>
      )}

      {!cargando && error && <div className="alert alert-warning m-3" role="alert">{error}</div>}

      {!cargando && !error && visibles.length === 0 && (
        <p className="text-center text-muted py-5 mb-0">
          {filas.length === 0 ? 'Todavía no hay registros.' : `Nada coincide con "${busqueda}".`}
        </p>
      )}

      {!cargando && !error && visibles.length > 0 && (
        <div className="table-responsive">
          <table className="table st-tabla align-middle mb-0">
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                {otrasColumnas.map((c) => <th key={c.nombre} scope="col">{c.etiqueta}</th>)}
                <th scope="col" className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((fila) => (
                <tr key={fila.id}>
                  <td>
                    <div className="st-tabla-nombre">
                      <img src={imagenDe(fila, categoriaDe(seccion, fila), 96, 96)} alt="" loading="lazy" />
                      <div>
                        <strong>{fila.nombre}</strong>
                        <small>{fila.municipio}</small>
                      </div>
                    </div>
                  </td>
                  {otrasColumnas.map((c) => <td key={c.nombre}><Celda seccion={seccion} columna={c.nombre} fila={fila} /></td>)}
                  <td className="text-end text-nowrap">
                    <Link to={rutaDetalle(seccion, fila)} className="st-accion" title="Ver en el sitio" aria-label={`Ver ${fila.nombre} en el sitio`}><Eye size={17} /></Link>
                    <button type="button" className="st-accion" title="Editar" aria-label={`Editar ${fila.nombre}`} onClick={() => abrir(fila)}><Pencil size={17} /></button>
                    <button type="button" className="st-accion peligro" title="Eliminar" aria-label={`Eliminar ${fila.nombre}`} onClick={() => setPorBorrar(fila)}><Trash2 size={17} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal show={Boolean(formulario)} onHide={() => !guardando && setFormulario(null)} size="lg" centered scrollable>
        {formulario && (
          <form onSubmit={guardar} className="d-contents">
            <Modal.Header closeButton>
              <Modal.Title as="h3" className="h5">{formulario.id ? `Editar ${singular}` : `Nuevo ${singular}`}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="row g-3">
                {campos.map((c) => (
                  <Campo key={c.nombre} campo={c} valor={formulario.valores[c.nombre]} onChange={cambiar} municipios={municipios} />
                ))}
                <VistaPrevia key={formulario.valores.imagen_url} url={formulario.valores.imagen_url?.trim()} />
              </div>
              {errorFormulario && <div className="alert alert-warning small mt-3 mb-0" role="alert">{errorFormulario}</div>}
            </Modal.Body>
            <Modal.Footer>
              <button type="button" className="btn btn-light" onClick={() => setFormulario(null)} disabled={guardando}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
            </Modal.Footer>
          </form>
        )}
      </Modal>

      <Modal show={Boolean(porBorrar)} onHide={() => !borrando && setPorBorrar(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title as="h3" className="h5">¿Eliminar este {singular}?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <strong>{porBorrar?.nombre}</strong> dejará de verse en el sitio. Queda guardado en la base
          (se marca como inactivo), así que se puede recuperar si fue un error.
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-light" onClick={() => setPorBorrar(null)} disabled={borrando}>Cancelar</button>
          <button type="button" className="btn btn-danger" onClick={eliminar} disabled={borrando}>{borrando ? 'Eliminando…' : 'Eliminar'}</button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}

export default TablaCrud;
