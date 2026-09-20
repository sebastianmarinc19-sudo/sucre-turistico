import { useEffect, useState } from 'react';
import api, { mensajeDeError } from '../api/client';
import TarjetaDestino from '../components/TarjetaDestino';

const MUNICIPIOS = ['Coveñas', 'Santiago de Tolú', 'San Onofre'];
const CATEGORIAS = [
  { valor: 'playa', etiqueta: 'Playas' },
  { valor: 'atractivo_natural', etiqueta: 'Atractivos naturales' },
  { valor: 'atractivo_cultural', etiqueta: 'Atractivos culturales' },
  { valor: 'lugar_turistico', etiqueta: 'Lugares turisticos' },
];

function Destinos() {
  // Tres estados que SIEMPRE hay que manejar al llamar a una API:
  // los datos, si esta cargando, y si algo fallo.
  const [destinos, setDestinos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [municipio, setMunicipio] = useState('');
  const [categoria, setCategoria] = useState('');

  useEffect(() => {
    // `cancelado` evita actualizar el estado si el componente ya se desmonto
    // o si el usuario cambio de filtro antes de que llegara la respuesta.
    let cancelado = false;

    async function cargarDestinos() {
      setCargando(true);
      setError(null);
      try {
        // Los filtros vacios no se mandan: axios ignora los undefined.
        const { data } = await api.get('/api/destinos', {
          params: {
            municipio: municipio || undefined,
            categoria: categoria || undefined,
          },
        });
        if (!cancelado) setDestinos(data);
      } catch (err) {
        if (!cancelado) setError(mensajeDeError(err));
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargarDestinos();
    return () => { cancelado = true; };
  }, [municipio, categoria]);

  return (
    <section>
      <header className="mb-4">
        <h2 className="h3">Destinos del Golfo de Morrosquillo</h2>
        <p className="text-muted">Playas, atractivos naturales y lugares turisticos de la region.</p>
      </header>

      <div className="row g-2 mb-4">
        <div className="col-12 col-sm-6">
          <label className="form-label small text-muted" htmlFor="filtro-municipio">Municipio</label>
          <select
            id="filtro-municipio"
            className="form-select"
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
          >
            <option value="">Todos</option>
            {MUNICIPIOS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="col-12 col-sm-6">
          <label className="form-label small text-muted" htmlFor="filtro-categoria">Categoria</label>
          <select
            id="filtro-categoria"
            className="form-select"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="">Todas</option>
            {CATEGORIAS.map((c) => <option key={c.valor} value={c.valor}>{c.etiqueta}</option>)}
          </select>
        </div>
      </div>

      {cargando && (
        <div className="text-center py-5">
          <div className="spinner-border text-secondary" role="status">
            <span className="visually-hidden">Cargando destinos…</span>
          </div>
        </div>
      )}

      {!cargando && error && (
        <div className="alert alert-warning" role="alert">
          <p className="mb-1 fw-semibold">No se pudieron cargar los destinos</p>
          <p className="mb-0 small">{error}</p>
        </div>
      )}

      {!cargando && !error && destinos.length === 0 && (
        <div className="alert alert-light border text-center" role="status">
          No hay destinos que coincidan con los filtros.
        </div>
      )}

      {!cargando && !error && destinos.length > 0 && (
        <div className="row g-3">
          {destinos.map((d) => <TarjetaDestino key={d.id} destino={d} />)}
        </div>
      )}
    </section>
  );
}

export default Destinos;
