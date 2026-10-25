import { useEffect, useState } from 'react';
import api, { mensajeDeError } from '../api/client';
import TarjetaEvento from '../components/TarjetaEvento';

const TIPOS = [
  { valor: 'festival', etiqueta: 'Festivales' },
  { valor: 'feria', etiqueta: 'Ferias' },
  { valor: 'religioso', etiqueta: 'Religiosos' },
  { valor: 'cultural', etiqueta: 'Culturales' },
  { valor: 'deportivo', etiqueta: 'Deportivos' },
];

// Fecha local en formato AAAA-MM-DD, el que espera la API.
function hoy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function Eventos() {
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [municipios, setMunicipios] = useState([]);
  const [municipio, setMunicipio] = useState('');
  const [tipo, setTipo] = useState('');
  // Una agenda muestra lo que viene: por defecto, solo eventos desde hoy.
  const [desde, setDesde] = useState(hoy());
  const [hasta, setHasta] = useState('');

  // Si falla, el filtro queda solo con "Todos": la lista principal sigue funcionando.
  useEffect(() => {
    api.get('/api/eventos/catalogos/municipios')
      .then(({ data }) => setMunicipios(data))
      .catch(() => setMunicipios([]));
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError(null);
      try {
        const { data } = await api.get('/api/eventos', {
          params: {
            municipio: municipio || undefined,
            tipo: tipo || undefined,
            desde: desde || undefined,
            hasta: hasta || undefined,
          },
        });
        if (!cancelado) setEventos(data);
      } catch (err) {
        if (!cancelado) setError(mensajeDeError(err));
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();
    return () => { cancelado = true; };
  }, [municipio, tipo, desde, hasta]);

  return (
    <section>
      <header className="mb-4">
        <h2 className="h3">Eventos</h2>
        <p className="text-muted">Festivales, ferias y agenda cultural de Sucre.</p>
      </header>

      <div className="row g-2 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <label className="form-label small text-muted" htmlFor="filtro-municipio">Municipio</label>
          <select id="filtro-municipio" className="form-select" value={municipio} onChange={(e) => setMunicipio(e.target.value)}>
            <option value="">Todos</option>
            {municipios.map((m) => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
          </select>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <label className="form-label small text-muted" htmlFor="filtro-tipo">Tipo</label>
          <select id="filtro-tipo" className="form-select" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos</option>
            {TIPOS.map((t) => <option key={t.valor} value={t.valor}>{t.etiqueta}</option>)}
          </select>
        </div>
        <div className="col-6 col-lg-3">
          <label className="form-label small text-muted" htmlFor="filtro-desde">Desde</label>
          <input id="filtro-desde" type="date" className="form-control" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="col-6 col-lg-3">
          <label className="form-label small text-muted" htmlFor="filtro-hasta">Hasta</label>
          <input id="filtro-hasta" type="date" className="form-control" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} />
        </div>
      </div>

      {cargando && (
        <div className="text-center py-5">
          <div className="spinner-border text-secondary" role="status">
            <span className="visually-hidden">Cargando eventos…</span>
          </div>
        </div>
      )}

      {!cargando && error && (
        <div className="alert alert-warning" role="alert">
          <p className="mb-1 fw-semibold">No se pudieron cargar los eventos</p>
          <p className="mb-0 small">{error}</p>
        </div>
      )}

      {!cargando && !error && eventos.length === 0 && (
        <div className="alert alert-light border text-center" role="status">
          No hay eventos en esas fechas con esos filtros.
          {desde && (
            <button type="button" className="btn btn-link btn-sm" onClick={() => { setDesde(''); setHasta(''); }}>
              Ver todos los eventos
            </button>
          )}
        </div>
      )}

      {!cargando && !error && eventos.length > 0 && (
        <div className="row g-3">
          {eventos.map((e) => <TarjetaEvento key={e.id} evento={e} />)}
        </div>
      )}
    </section>
  );
}

export default Eventos;
