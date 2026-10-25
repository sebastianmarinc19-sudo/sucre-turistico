import { useEffect, useState } from 'react';
import api, { mensajeDeError } from '../api/client';
import TarjetaExperiencia from '../components/TarjetaExperiencia';

const TIPOS = [
  { valor: 'acuatica', etiqueta: 'Acuáticas' },
  { valor: 'ecoturismo', etiqueta: 'Ecoturismo' },
  { valor: 'cultural', etiqueta: 'Culturales' },
  { valor: 'aventura', etiqueta: 'Aventura' },
  { valor: 'gastronomica', etiqueta: 'Gastronómicas' },
];

const PRECIOS = [
  { valor: '50000', etiqueta: 'Hasta $50.000' },
  { valor: '100000', etiqueta: 'Hasta $100.000' },
  { valor: '200000', etiqueta: 'Hasta $200.000' },
];

function Experiencias() {
  const [experiencias, setExperiencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [municipios, setMunicipios] = useState([]);
  const [municipio, setMunicipio] = useState('');
  const [tipo, setTipo] = useState('');
  const [precioMax, setPrecioMax] = useState('');

  // Si falla, el filtro queda solo con "Todos": la lista principal sigue funcionando.
  useEffect(() => {
    api.get('/api/experiencias/catalogos/municipios')
      .then(({ data }) => setMunicipios(data))
      .catch(() => setMunicipios([]));
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError(null);
      try {
        const { data } = await api.get('/api/experiencias', {
          params: {
            municipio: municipio || undefined,
            tipo: tipo || undefined,
            precio_max: precioMax || undefined,
          },
        });
        if (!cancelado) setExperiencias(data);
      } catch (err) {
        if (!cancelado) setError(mensajeDeError(err));
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();
    return () => { cancelado = true; };
  }, [municipio, tipo, precioMax]);

  return (
    <section>
      <header className="mb-4">
        <h2 className="h3">Experiencias</h2>
        <p className="text-muted">Paseos, recorridos y actividades para vivir el Golfo de Morrosquillo.</p>
      </header>

      <div className="row g-2 mb-4">
        <div className="col-12 col-sm-4">
          <label className="form-label small text-muted" htmlFor="filtro-municipio">Municipio</label>
          <select id="filtro-municipio" className="form-select" value={municipio} onChange={(e) => setMunicipio(e.target.value)}>
            <option value="">Todos</option>
            {municipios.map((m) => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
          </select>
        </div>
        <div className="col-12 col-sm-4">
          <label className="form-label small text-muted" htmlFor="filtro-tipo">Tipo</label>
          <select id="filtro-tipo" className="form-select" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todas</option>
            {TIPOS.map((t) => <option key={t.valor} value={t.valor}>{t.etiqueta}</option>)}
          </select>
        </div>
        <div className="col-12 col-sm-4">
          <label className="form-label small text-muted" htmlFor="filtro-precio">Precio por persona</label>
          <select id="filtro-precio" className="form-select" value={precioMax} onChange={(e) => setPrecioMax(e.target.value)}>
            <option value="">Cualquiera</option>
            {PRECIOS.map((p) => <option key={p.valor} value={p.valor}>{p.etiqueta}</option>)}
          </select>
        </div>
      </div>

      {cargando && (
        <div className="text-center py-5">
          <div className="spinner-border text-secondary" role="status">
            <span className="visually-hidden">Cargando experiencias…</span>
          </div>
        </div>
      )}

      {!cargando && error && (
        <div className="alert alert-warning" role="alert">
          <p className="mb-1 fw-semibold">No se pudieron cargar las experiencias</p>
          <p className="mb-0 small">{error}</p>
        </div>
      )}

      {!cargando && !error && experiencias.length === 0 && (
        <div className="alert alert-light border text-center" role="status">
          No hay experiencias que coincidan con los filtros.
        </div>
      )}

      {!cargando && !error && experiencias.length > 0 && (
        <div className="row g-3">
          {experiencias.map((x) => <TarjetaExperiencia key={x.id} experiencia={x} />)}
        </div>
      )}
    </section>
  );
}

export default Experiencias;
