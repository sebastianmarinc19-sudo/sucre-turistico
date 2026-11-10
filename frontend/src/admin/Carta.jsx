import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import { toast } from 'sonner';
import api, { mensajeDeError } from '../api/client';
import { pesos } from '../catalogo';

const VACIO = { nombre: '', descripcion: '', precio: '', es_tipico: true };

// La carta de un restaurante: la ve el turista en el detalle y la maneja el
// dueno (o el superadmin) desde aqui.
function Carta({ restaurante, onCerrar }) {
  const [platos, setPlatos] = useState(null);
  const [error, setError] = useState(null);
  const [formulario, setFormulario] = useState(null); // { id?, nombre, ... }
  const [guardando, setGuardando] = useState(false);
  const [version, setVersion] = useState(0);
  const ruta = `/api/gastronomia/${restaurante.id}`;

  useEffect(() => {
    let cancelado = false;
    // panel=1: la carta tambien de un restaurante que todavia esta oculto.
    api.get(ruta, { params: { panel: 1 } })
      .then(({ data }) => { if (!cancelado) setPlatos(data.platos || []); })
      .catch((err) => { if (!cancelado) setError(mensajeDeError(err)); });
    return () => { cancelado = true; };
  }, [ruta, version]);

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    const { id, ...valores } = formulario;
    const cuerpo = { ...valores, precio: valores.precio === '' ? null : Number(valores.precio) };
    try {
      if (id) await api.put(`${ruta}/platos/${id}`, cuerpo);
      else await api.post(`${ruta}/platos`, cuerpo);
      toast.success(id ? 'Plato actualizado' : 'Plato agregado a la carta', { description: cuerpo.nombre });
      setFormulario(null);
      setVersion((v) => v + 1);
    } catch (err) {
      toast.error('No se pudo guardar el plato', { description: mensajeDeError(err) });
    } finally {
      setGuardando(false);
    }
  }

  async function quitar(plato) {
    try {
      await api.delete(`${ruta}/platos/${plato.id}`);
      toast.success(`Se quitó "${plato.nombre}" de la carta`);
      setVersion((v) => v + 1);
    } catch (err) {
      toast.error('No se pudo quitar', { description: mensajeDeError(err) });
    }
  }

  const campo = (nombre, valor) => setFormulario((f) => ({ ...f, [nombre]: valor }));

  return (
    <Modal show onHide={onCerrar} size="lg" centered scrollable>
      <Modal.Header closeButton><Modal.Title as="h3" className="h5">Carta de {restaurante.nombre}</Modal.Title></Modal.Header>
      <Modal.Body>
        {error && <div className="alert alert-warning small">{error}</div>}
        {!platos && !error && <div className="text-center py-4"><div className="spinner-border" role="status"><span className="visually-hidden">Cargando…</span></div></div>}

        {platos && !formulario && (
          <>
            {platos.length === 0 && <p className="text-muted text-center py-3">La carta está vacía. Agrega el primer plato.</p>}
            <ul className="st-carta">
              {platos.map((p) => (
                <li key={p.id}>
                  <div>
                    <strong>{p.nombre}</strong>
                    {Boolean(p.es_tipico) && <span className="st-badge suave ms-2">Típico</span>}
                    {p.descripcion && <p>{p.descripcion}</p>}
                  </div>
                  <div className="d-flex align-items-center gap-1 text-nowrap">
                    {p.precio != null && <span className="st-precio me-2">{pesos(p.precio)}</span>}
                    <button type="button" className="st-accion" aria-label={`Editar ${p.nombre}`}
                      onClick={() => setFormulario({ id: p.id, nombre: p.nombre, descripcion: p.descripcion || '', precio: p.precio ?? '', es_tipico: Boolean(p.es_tipico) })}>
                      <Pencil size={16} />
                    </button>
                    <button type="button" className="st-accion peligro" aria-label={`Quitar ${p.nombre}`} onClick={() => quitar(p)}><Trash2 size={16} /></button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {formulario && (
          <form id="form-plato" onSubmit={guardar} className="row g-3">
            <div className="col-12 col-md-8">
              <label className="form-label small" htmlFor="plato-nombre">Plato <span className="text-danger">*</span></label>
              <input id="plato-nombre" className="form-control" required value={formulario.nombre} onChange={(e) => campo('nombre', e.target.value)} />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label small" htmlFor="plato-precio">Precio</label>
              <input id="plato-precio" type="number" min={0} step="any" className="form-control" value={formulario.precio} onChange={(e) => campo('precio', e.target.value)} />
            </div>
            <div className="col-12">
              <label className="form-label small" htmlFor="plato-desc">Descripción</label>
              <textarea id="plato-desc" rows={2} className="form-control" value={formulario.descripcion} onChange={(e) => campo('descripcion', e.target.value)} />
            </div>
            <div className="col-12 form-check ms-2">
              <input id="plato-tipico" type="checkbox" className="form-check-input" checked={formulario.es_tipico} onChange={(e) => campo('es_tipico', e.target.checked)} />
              <label className="form-check-label small" htmlFor="plato-tipico">Es un plato típico de la región</label>
            </div>
          </form>
        )}
      </Modal.Body>
      <Modal.Footer>
        {formulario ? (
          <>
            <button type="button" className="btn btn-light" onClick={() => setFormulario(null)} disabled={guardando}>Cancelar</button>
            <button type="submit" form="form-plato" className="btn btn-primary" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar plato'}</button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-light" onClick={onCerrar}>Cerrar</button>
            <button type="button" className="btn btn-primary" onClick={() => setFormulario(VACIO)} disabled={!platos}>
              <Plus size={16} aria-hidden="true" /> Agregar plato
            </button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
}

export default Carta;
