import { useEffect, useState } from 'react';
import api, { mensajeDeError } from '../api/client';

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
    <div className={campo.tipo === 'textarea' ? 'col-12' : 'col-12 col-md-6'}>
      <label className="form-label small" htmlFor={id}>
        {campo.etiqueta}{campo.obligatorio && <span className="text-danger"> *</span>}
      </label>
      {control}
    </div>
  );
}

function TablaCrud({ entidad }) {
  const { endpoint, columnas, campos, singular, titulo } = entidad;

  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [municipios, setMunicipios] = useState([]);

  // null = formulario cerrado; { id, valores } = abierto (id null si es nuevo).
  const [formulario, setFormulario] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState(null);
  const [aviso, setAviso] = useState(null);

  // Subirlo vuelve a pedir la lista (despues de crear, editar o eliminar).
  const [version, setVersion] = useState(0);
  const recargar = () => setVersion((v) => v + 1);

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
    setAviso(null);
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
      setAviso(formulario.id ? `Se guardaron los cambios.` : `Se creó el ${singular}.`);
      setFormulario(null);
      recargar();
    } catch (err) {
      setErrorFormulario(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(fila) {
    if (!window.confirm(`¿Eliminar "${fila.nombre}"? Dejará de verse en el sitio.`)) return;
    setAviso(null);
    try {
      await api.delete(`${endpoint}/${fila.id}`);
      setAviso(`Se eliminó "${fila.nombre}".`);
      recargar();
    } catch (err) {
      setError(mensajeDeError(err));
    }
  }

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h4 mb-0">{titulo}</h2>
        {!formulario && (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => abrir(null)}>
            Nuevo {singular}
          </button>
        )}
      </div>

      {aviso && <div className="alert alert-success py-2 small" role="status">{aviso}</div>}

      {formulario && (
        <form className="card card-body mb-4" onSubmit={guardar}>
          <h3 className="h6">{formulario.id ? `Editar ${singular}` : `Nuevo ${singular}`}</h3>
          <div className="row g-3">
            {campos.map((c) => (
              <Campo key={c.nombre} campo={c} valor={formulario.valores[c.nombre]} onChange={cambiar} municipios={municipios} />
            ))}
          </div>
          {errorFormulario && <div className="alert alert-warning small mt-3 mb-0" role="alert">{errorFormulario}</div>}
          <div className="d-flex gap-2 mt-3">
            <button type="submit" className="btn btn-primary btn-sm" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setFormulario(null)} disabled={guardando}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {cargando && (
        <div className="text-center py-4">
          <div className="spinner-border text-secondary" role="status">
            <span className="visually-hidden">Cargando…</span>
          </div>
        </div>
      )}

      {!cargando && error && <div className="alert alert-warning" role="alert">{error}</div>}

      {!cargando && !error && filas.length === 0 && (
        <div className="alert alert-light border text-center">Todavía no hay registros.</div>
      )}

      {!cargando && !error && filas.length > 0 && (
        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                {columnas.map((c) => <th key={c.nombre} scope="col">{c.etiqueta}</th>)}
                <th scope="col" className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => (
                <tr key={fila.id}>
                  {columnas.map((c) => <td key={c.nombre}>{fila[c.nombre] ?? '—'}</td>)}
                  <td className="text-end text-nowrap">
                    <button type="button" className="btn btn-link btn-sm" onClick={() => abrir(fila)}>Editar</button>
                    <button type="button" className="btn btn-link btn-sm text-danger" onClick={() => eliminar(fila)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default TablaCrud;
