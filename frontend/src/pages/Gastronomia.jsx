import { useEffect, useState } from 'react';
import api, { mensajeDeError } from '../api/client';
import TarjetaRestaurante from '../components/TarjetaRestaurante';

const COCINAS = [
  { valor: 'tipica', etiqueta: 'Típica' },
  { valor: 'mariscos', etiqueta: 'Mariscos' },
  { valor: 'internacional', etiqueta: 'Internacional' },
  { valor: 'comida_rapida', etiqueta: 'Comida rápida' },
  { valor: 'vegetariana', etiqueta: 'Vegetariana' },
];

const PRECIOS = [
  { valor: 'economico', etiqueta: 'Económico' },
  { valor: 'medio', etiqueta: 'Medio' },
  { valor: 'alto', etiqueta: 'Alto' },
];

function Gastronomia() {
  const [restaurantes, setRestaurantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [municipios, setMunicipios] = useState([]);
  const [municipio, setMunicipio] = useState('');
  const [tipoCocina, setTipoCocina] = useState('');
  const [rangoPrecio, setRangoPrecio] = useState('');

  // Si falla, el filtro queda solo con "Todos": la lista principal sigue funcionando.
  useEffect(() => {
    api.get('/api/gastronomia/catalogos/municipios')
      .then(({ data }) => setMunicipios(data))
      .catch(() => setMunicipios([]));
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError(null);
      try {
        const { data } = await api.get('/api/gastronomia', {
          params: {
            municipio: municipio || undefined,
            tipo_cocina: tipoCocina || undefined,
            rango_precio: rangoPrecio || undefined,
          },
        });
        if (!cancelado) setRestaurantes(data);
      } catch (err) {
        if (!cancelado) setError(mensajeDeError(err));
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();
    return () => { cancelado = true; };
  }, [municipio, tipoCocina, rangoPrecio]);

  return (
    <section>
      <header className="mb-4">
        <h2 className="h3">Gastronomía</h2>
        <p className="text-muted">Restaurantes y cocina típica del Golfo de Morrosquillo.</p>
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
          <label className="form-label small text-muted" htmlFor="filtro-cocina">Tipo de cocina</label>
          <select id="filtro-cocina" className="form-select" value={tipoCocina} onChange={(e) => setTipoCocina(e.target.value)}>
            <option value="">Todas</option>
            {COCINAS.map((c) => <option key={c.valor} value={c.valor}>{c.etiqueta}</option>)}
          </select>
        </div>
        <div className="col-12 col-sm-4">
          <label className="form-label small text-muted" htmlFor="filtro-precio">Rango de precio</label>
          <select id="filtro-precio" className="form-select" value={rangoPrecio} onChange={(e) => setRangoPrecio(e.target.value)}>
            <option value="">Todos</option>
            {PRECIOS.map((p) => <option key={p.valor} value={p.valor}>{p.etiqueta}</option>)}
          </select>
        </div>
      </div>

      {cargando && (
        <div className="text-center py-5">
          <div className="spinner-border text-secondary" role="status">
            <span className="visually-hidden">Cargando restaurantes…</span>
          </div>
        </div>
      )}

      {!cargando && error && (
        <div className="alert alert-warning" role="alert">
          <p className="mb-1 fw-semibold">No se pudieron cargar los restaurantes</p>
          <p className="mb-0 small">{error}</p>
        </div>
      )}

      {!cargando && !error && restaurantes.length === 0 && (
        <div className="alert alert-light border text-center" role="status">
          No hay restaurantes que coincidan con los filtros.
        </div>
      )}

      {!cargando && !error && restaurantes.length > 0 && (
        <div className="row g-3">
          {restaurantes.map((r) => <TarjetaRestaurante key={r.id} restaurante={r} />)}
        </div>
      )}
    </section>
  );
}

export default Gastronomia;
