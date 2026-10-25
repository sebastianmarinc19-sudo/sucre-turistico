import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { mensajeDeError } from '../api/client';

const TIPOS = {
  destino: 'Destino', alojamiento: 'Alojamiento', restaurante: 'Restaurante',
  experiencia: 'Experiencia', evento: 'Evento',
};

const CATEGORIAS = {
  playa: 'Playa', atractivo_natural: 'Atractivo natural', atractivo_cultural: 'Atractivo cultural', lugar_turistico: 'Lugar turístico',
  hotel: 'Hotel', hostal: 'Hostal', posada: 'Posada', cabana: 'Cabaña', camping: 'Camping',
  tipica: 'Cocina típica', mariscos: 'Mariscos', internacional: 'Internacional', comida_rapida: 'Comida rápida', vegetariana: 'Vegetariana',
  acuatica: 'Acuática', cultural: 'Cultural', ecoturismo: 'Ecoturismo', aventura: 'Aventura', gastronomica: 'Gastronómica',
  festival: 'Festival', feria: 'Feria', religioso: 'Religioso', deportivo: 'Deportivo',
};

// Debe coincidir con POR_PAGINA de buscador-service (src/consultas.js).
const POR_PAGINA = 20;

const SECCIONES = {
  destino: 'Destinos', alojamiento: 'Alojamiento', restaurante: 'Gastronomía',
  experiencia: 'Experiencias', evento: 'Eventos',
};

const FACETS = [
  { clave: 'tipo', titulo: 'Tipo', etiqueta: (v) => TIPOS[v] || v },
  { clave: 'municipio', titulo: 'Municipio', etiqueta: (v) => v },
  { clave: 'categoria', titulo: 'Categoría', etiqueta: (v) => CATEGORIAS[v] || v },
  { clave: 'precio', titulo: 'Precio', etiqueta: (v, f) => f.etiqueta || v },
];
const FILTROS = FACETS.map((f) => f.clave);

function Sugerencias({ texto, onElegir }) {
  const [lista, setLista] = useState([]);

  useEffect(() => {
    if (texto.trim().length < 2) return undefined;
    let cancelado = false;
    // Espera a que se deje de escribir, para no pedir en cada tecla.
    const t = setTimeout(() => {
      api.get('/api/buscador/sugerencias', { params: { q: texto } })
        .then(({ data }) => { if (!cancelado) setLista(data); })
        .catch(() => { if (!cancelado) setLista([]); });
    }, 250);
    return () => { cancelado = true; clearTimeout(t); };
  }, [texto]);

  if (texto.trim().length < 2 || lista.length === 0) return null;
  return (
    <ul className="list-group position-absolute w-100 shadow-sm" style={{ zIndex: 10, top: '100%' }} role="listbox">
      {lista.map((s) => (
        <li key={`${s.tipo}-${s.nombre}`} className="list-group-item list-group-item-action" role="option" aria-selected="false"
          style={{ cursor: 'pointer' }} onMouseDown={() => onElegir(s.nombre)}>
          {s.nombre} <span className="text-muted small">· {TIPOS[s.tipo]}{s.municipio ? ` · ${s.municipio}` : ''}</span>
        </li>
      ))}
    </ul>
  );
}

function Resultado({ r }) {
  return (
    <div className="col-12 col-md-6">
      <article className="card h-100 shadow-sm">
        <div className="card-body d-flex flex-column">
          <p className="small mb-1">
            <span className="badge text-bg-secondary">{TIPOS[r.tipo] || r.tipo}</span>
            {r.categoria && <span className="badge text-bg-light ms-1">{CATEGORIAS[r.categoria] || r.categoria}</span>}
          </p>
          <h3 className="card-title h6 mb-1">{r.nombre}</h3>
          <p className="text-muted small mb-2">
            {r.municipio}
            {r.fecha_inicio && ` · desde ${r.fecha_inicio}`}
            {r.precio != null && ` · $${Number(r.precio).toLocaleString('es-CO')}`}
          </p>
          {r.descripcion && <p className="card-text small mb-2">{r.descripcion}</p>}
          <Link to={r.ruta} className="small mt-auto">Ver en {SECCIONES[r.tipo]} →</Link>
        </div>
      </article>
    </div>
  );
}

function Buscador() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const [texto, setTexto] = useState(q);
  const [enfocado, setEnfocado] = useState(false);
  const entrada = useRef(null);

  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const consulta = params.toString();
  useEffect(() => {
    let cancelado = false;
    const p = Object.fromEntries(new URLSearchParams(consulta));
    api.get('/api/buscador', { params: p })
      .then(({ data }) => { if (!cancelado) { setDatos(data); setError(null); } })
      .catch((err) => {
        if (cancelado) return;
        setError(err.response?.status === 503 ? 'El buscador todavía no tiene datos. Intenta en un momento.' : mensajeDeError(err));
      })
      .finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, [consulta]);

  function cambiar(cambios) {
    const siguiente = new URLSearchParams(params);
    // Cualquier cambio de busqueda o filtro vuelve a la primera pagina.
    if (!('pagina' in cambios)) siguiente.delete('pagina');
    for (const [k, v] of Object.entries(cambios)) {
      if (v) siguiente.set(k, v); else siguiente.delete(k);
    }
    // Si la busqueda no cambia, el efecto no se vuelve a ejecutar.
    if (siguiente.toString() === params.toString()) return;
    setCargando(true);
    setParams(siguiente);
  }

  function buscar(valor) {
    setTexto(valor);
    setEnfocado(false);
    entrada.current?.blur();
    cambiar({ q: valor.trim() });
  }

  const hayFiltros = FILTROS.some((f) => params.get(f));
  const pagina = Math.max(1, Number(params.get('pagina')) || 1);
  const paginas = datos ? Math.ceil(datos.total / POR_PAGINA) : 0;

  return (
    <section>
      <header className="mb-3">
        <h2 className="h3">Buscar en todo Sucre Turístico</h2>
        <p className="text-muted">Destinos, alojamientos, restaurantes, experiencias y eventos en un solo lugar.</p>
      </header>

      <form className="mb-4" role="search" onSubmit={(e) => { e.preventDefault(); buscar(texto); }}>
        <div className="position-relative">
          <div className="input-group">
            <input ref={entrada} type="search" className="form-control" placeholder="Ej: playa, manglar, festival, Coveñas…"
              aria-label="Buscar" value={texto} autoComplete="off"
              onChange={(e) => setTexto(e.target.value)} onFocus={() => setEnfocado(true)} onBlur={() => setEnfocado(false)} />
            <button type="submit" className="btn btn-primary">Buscar</button>
          </div>
          {enfocado && <Sugerencias texto={texto} onElegir={buscar} />}
        </div>
      </form>

      <div className="row g-4">
        <aside className="col-12 col-lg-3">
          {datos && FACETS.map((f) => {
            const valores = datos.facets[f.clave] || [];
            if (valores.length === 0) return null;
            const elegido = params.get(f.clave);
            return (
              <div key={f.clave} className="mb-3">
                <h3 className="h6">{f.titulo}</h3>
                <div className="list-group list-group-flush small">
                  {valores.map((v) => (
                    <button key={v.valor} type="button"
                      className={`list-group-item list-group-item-action d-flex justify-content-between px-2 py-1 ${elegido === v.valor ? 'active' : ''}`}
                      aria-pressed={elegido === v.valor}
                      onClick={() => cambiar({ [f.clave]: elegido === v.valor ? null : v.valor })}>
                      <span>{f.etiqueta(v.valor, v)}</span><span>{v.cantidad}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {hayFiltros && (
            <button type="button" className="btn btn-link btn-sm px-0" onClick={() => cambiar(Object.fromEntries(FILTROS.map((f) => [f, null])))}>
              Quitar filtros
            </button>
          )}
        </aside>

        <div className="col-12 col-lg-9">
          {cargando && (
            <div className="text-center py-5">
              <div className="spinner-border text-secondary" role="status"><span className="visually-hidden">Buscando…</span></div>
            </div>
          )}
          {!cargando && error && <div className="alert alert-warning" role="alert">{error}</div>}
          {!cargando && !error && datos && datos.total === 0 && (
            <div className="alert alert-light border text-center" role="status">
              No encontramos resultados{q && <> para <strong>“{q}”</strong></>}. Prueba con otra palabra o quita filtros.
            </div>
          )}
          {!cargando && !error && datos && datos.total > 0 && (
            <>
              <p className="small text-muted">{datos.total} resultado{datos.total === 1 ? '' : 's'}{q && <> para “{q}”</>}</p>
              <div className="row g-3">
                {datos.resultados.map((r) => <Resultado key={`${r.tipo}-${r.ref_id}`} r={r} />)}
              </div>
              {paginas > 1 && (
                <nav className="d-flex justify-content-center align-items-center gap-3 mt-4" aria-label="Páginas de resultados">
                  <button type="button" className="btn btn-outline-secondary btn-sm" disabled={pagina <= 1}
                    onClick={() => cambiar({ pagina: pagina - 1 > 1 ? String(pagina - 1) : null })}>Anterior</button>
                  <span className="small text-muted">Página {pagina} de {paginas}</span>
                  <button type="button" className="btn btn-outline-secondary btn-sm" disabled={pagina >= paginas}
                    onClick={() => cambiar({ pagina: String(pagina + 1) })}>Siguiente</button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default Buscador;
