import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { mensajeDeError } from '../api/client';
import { CATALOGO, categoriaDe, etiquetaDe, pesos, RANGOS_PRECIO } from '../catalogo';
import Carrusel from '../components/Carrusel';
import { AvisoDespertando } from '../components/Cargando';
import MapaMunicipios from '../components/MapaMunicipios';
import TarjetaDe from '../components/TarjetaDe';
import { useEsperaLarga } from '../components/useEsperaLarga';
import { hoy, rangoDeFechas } from '../fechas';
import { imagenDe } from '../imagenes';

const ICONOS_SERVICIO = {
  wifi: 'fa-wifi',
  piscina: 'fa-person-swimming',
  aire_acondicionado: 'fa-snowflake',
  parqueadero: 'fa-square-parking',
  restaurante: 'fa-utensils',
  ventilador: 'fa-fan',
  cocina: 'fa-kitchen-set',
  desayuno: 'fa-mug-saucer',
  lockers: 'fa-lock',
  banos: 'fa-restroom',
  duchas: 'fa-shower',
  alquiler_carpas: 'fa-campground',
};

const MAXIMO_RELACIONADOS = 8;

// Los datos de la ficha lateral de cada seccion: [icono, etiqueta, valor].
// Las filas sin valor no se muestran.
function datosClave(seccion, r) {
  const filas = {
    destinos: [
      ['fa-tag', 'Categoría', etiquetaDe(seccion, r)],
    ],
    alojamiento: [
      ['fa-tag', 'Tipo', etiquetaDe(seccion, r)],
      ['fa-star', 'Categoría', r.estrellas > 0 ? `${r.estrellas} ${r.estrellas === 1 ? 'estrella' : 'estrellas'}` : null],
      ['fa-user-group', 'Capacidad', r.capacidad ? `Hasta ${r.capacidad} personas` : null],
      ['fa-map-pin', 'Dirección', r.direccion],
      ['fa-phone', 'Teléfono', r.telefono],
    ],
    gastronomia: [
      ['fa-utensils', 'Cocina', etiquetaDe(seccion, r)],
      ['fa-wallet', 'Precios', RANGOS_PRECIO[r.rango_precio]?.texto],
      ['fa-map-pin', 'Dirección', r.direccion],
      ['fa-phone', 'Teléfono', r.telefono],
    ],
    experiencias: [
      ['fa-tag', 'Tipo', etiquetaDe(seccion, r)],
      ['fa-clock', 'Duración', r.duracion_horas != null ? `${Number(r.duracion_horas).toLocaleString('es-CO')} horas` : null],
      ['fa-id-badge', 'Operador', r.operador],
    ],
    eventos: [
      ['fa-tag', 'Tipo', etiquetaDe(seccion, r)],
      ['fa-calendar-days', 'Fechas', rangoDeFechas(r.fecha_inicio, r.fecha_fin)],
      ['fa-location-dot', 'Lugar', r.lugar],
    ],
  }[seccion];
  return filas.filter(([, , valor]) => valor);
}

// El precio destacado de la ficha, o null si la seccion no cobra.
function precioDestacado(seccion, r) {
  if (seccion === 'alojamiento' && r.precio_noche != null) return { valor: pesos(r.precio_noche), unidad: 'por noche' };
  if (seccion === 'experiencias' && r.precio != null) return { valor: pesos(r.precio), unidad: 'por persona' };
  if (seccion === 'gastronomia' && RANGOS_PRECIO[r.rango_precio]) return { valor: RANGOS_PRECIO[r.rango_precio].simbolo, unidad: RANGOS_PRECIO[r.rango_precio].texto };
  if (seccion === 'eventos') {
    const gratis = r.precio_entrada == null || Number(r.precio_entrada) === 0;
    return gratis ? { valor: 'Gratis', unidad: 'entrada libre' } : { valor: pesos(r.precio_entrada), unidad: 'entrada' };
  }
  return null;
}

// Primero los del mismo municipio, despues los de la misma categoria.
function relacionados(seccion, actual, todos) {
  const otros = todos.filter((r) => r.id !== actual.id);
  const categoria = categoriaDe(seccion, actual);
  const puntaje = (r) => (r.municipio === actual.municipio ? 2 : 0) + (categoriaDe(seccion, r) === categoria ? 1 : 0);
  return otros
    .map((r) => ({ r, p: puntaje(r) }))
    .filter(({ p }) => p > 0)
    .sort((a, b) => b.p - a.p)
    .slice(0, MAXIMO_RELACIONADOS)
    .map(({ r }) => r);
}

function Carta({ platos }) {
  if (!platos?.length) return null;
  return (
    <section className="st-detalle-bloque">
      <h2><i className="fas fa-book-open" aria-hidden="true" /> Carta</h2>
      <ul className="st-carta">
        {platos.map((p) => (
          <li key={p.id}>
            <div>
              <strong>{p.nombre}</strong>
              {Boolean(p.es_tipico) && <span className="st-badge suave ms-2">Típico</span>}
              {p.descripcion && <p>{p.descripcion}</p>}
            </div>
            {p.precio != null && <span className="st-precio">{pesos(p.precio)}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Servicios({ servicios }) {
  if (!Array.isArray(servicios) || servicios.length === 0) return null;
  return (
    <section className="st-detalle-bloque">
      <h2><i className="fas fa-bell-concierge" aria-hidden="true" /> Servicios</h2>
      <ul className="st-servicios">
        {servicios.map((s) => (
          <li key={s}><i className={`fas ${ICONOS_SERVICIO[s] || 'fa-check'}`} aria-hidden="true" /> {s.replace(/_/g, ' ')}</li>
        ))}
      </ul>
    </section>
  );
}

function Detalle({ seccion }) {
  const { id } = useParams();
  const config = CATALOGO[seccion];

  const [registro, setRegistro] = useState(null);
  const [todos, setTodos] = useState([]);
  const [error, setError] = useState(null);
  const [noExiste, setNoExiste] = useState(false);
  const cargando = !registro && !error && !noExiste;
  const esperaLarga = useEsperaLarga(cargando);

  useEffect(() => {
    let cancelado = false;
    api.get(`${config.endpoint}/${id}`)
      .then(({ data }) => { if (!cancelado) setRegistro(data); })
      .catch((err) => {
        if (cancelado) return;
        if (err.response?.status === 404) setNoExiste(true);
        else setError(mensajeDeError(err));
      });
    // Los relacionados son un extra: si fallan, la pagina sigue sin ellos.
    const params = seccion === 'eventos' ? { desde: hoy() } : undefined;
    api.get(config.endpoint, { params })
      .then(({ data }) => { if (!cancelado) setTodos(data); })
      .catch(() => {});
    return () => { cancelado = true; };
  }, [config.endpoint, id, seccion]);

  useEffect(() => {
    if (registro) document.title = `${registro.nombre} · Sucre Turístico`;
    return () => { document.title = 'Sucre Turístico — Golfo de Morrosquillo'; };
  }, [registro]);

  if (noExiste || error) {
    return (
      <section className="container text-center py-5">
        <i className={`fas ${noExiste ? 'fa-compass' : 'fa-triangle-exclamation'} fa-3x mb-3 text-muted opacity-50`} aria-hidden="true" />
        <h1 className="h3">{noExiste ? `No encontramos este ${config.singular}` : `No se pudo cargar el ${config.singular}`}</h1>
        <p className="text-muted">{noExiste ? 'Puede que lo hayan quitado del catálogo.' : error}</p>
        <Link to={config.ruta} className="btn btn-primary">Ver {config.titulo.toLowerCase()}</Link>
      </section>
    );
  }

  if (cargando) {
    return (
      <>
        <div className="st-detalle-hero st-esqueleto" aria-hidden="true" />
        <div className="container py-4">
          <span className="visually-hidden" role="status">Cargando…</span>
          {esperaLarga && <AvisoDespertando />}
          <div className="st-esqueleto st-esqueleto-linea mb-3" style={{ width: '60%', height: 18 }} />
          <div className="st-esqueleto st-esqueleto-linea mb-2" />
          <div className="st-esqueleto st-esqueleto-linea" style={{ width: '80%' }} />
        </div>
      </>
    );
  }

  const r = registro;
  const precio = precioDestacado(seccion, r);
  const filas = datosClave(seccion, r);
  const otros = relacionados(seccion, r, todos);

  return (
    <>
      <header className="st-detalle-hero">
        <img src={imagenDe(r, categoriaDe(seccion, r), 1600, 700)} alt="" />
        <div className="st-detalle-capa" />
        <div className="container st-detalle-hero-contenido">
          <nav className="st-migas" aria-label="Ruta de navegación">
            <Link to="/">Inicio</Link> <span aria-hidden="true">›</span> <Link to={config.ruta}>{config.titulo}</Link> <span aria-hidden="true">›</span> {r.nombre}
          </nav>
          <span className="st-badge">{etiquetaDe(seccion, r)}</span>
          <h1>{r.nombre}</h1>
          <p><i className="fas fa-location-dot" aria-hidden="true" /> {r.municipio}, Sucre</p>
        </div>
      </header>

      <div className="container py-4">
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <section className="st-detalle-bloque">
              <h2><i className="fas fa-circle-info" aria-hidden="true" /> Descripción</h2>
              <p className="st-detalle-texto">{r.descripcion || 'Este lugar todavía no tiene descripción.'}</p>
            </section>
            {seccion === 'alojamiento' && <Servicios servicios={r.servicios} />}
            {seccion === 'gastronomia' && <Carta platos={r.platos} />}
            <section className="st-detalle-bloque">
              <h2><i className="fas fa-map" aria-hidden="true" /> Ubicación</h2>
              <p className="text-muted small mb-2">El punto marca el municipio: {r.municipio}.</p>
              <MapaMunicipios lugares={[{ seccion, registro: r }]} alto={260} destacado={r.municipio} />
            </section>
          </div>

          <aside className="col-12 col-lg-4">
            <div className="st-ficha">
              {precio && (
                <p className="st-ficha-precio">
                  <span className="st-precio">{precio.valor}</span> <small>{precio.unidad}</small>
                </p>
              )}
              <dl>
                {filas.map(([icono, etiqueta, valor]) => (
                  <div key={etiqueta}>
                    <dt><i className={`fas ${icono}`} aria-hidden="true" /> {etiqueta}</dt>
                    <dd>{valor}</dd>
                  </div>
                ))}
                <div>
                  <dt><i className="fas fa-location-dot" aria-hidden="true" /> Municipio</dt>
                  <dd>{r.municipio}</dd>
                </div>
              </dl>
              <Link to={config.ruta} className="btn btn-outline-primary w-100">
                <i className="fas fa-arrow-left" aria-hidden="true" /> Volver a {config.titulo}
              </Link>
            </div>
          </aside>
        </div>

        {otros.length > 0 && (
          <section className="st-seccion">
            <div className="st-seccion-titulo">
              <div>
                <h2>También te puede interesar</h2>
                <p>Más {config.titulo.toLowerCase()} en {r.municipio} y parecidos.</p>
              </div>
            </div>
            <Carrusel etiqueta="Relacionados">
              {otros.map((o) => <TarjetaDe key={o.id} seccion={seccion} registro={o} columna={null} />)}
            </Carrusel>
          </section>
        )}
      </div>
    </>
  );
}

// Con key={id}, al pasar de un relacionado a otro el componente se monta de
// nuevo y arranca limpio (cargando), en vez de mostrar el anterior un rato.
function DetallePorId({ seccion }) {
  const { id } = useParams();
  return <Detalle key={id} seccion={seccion} />;
}

export default DetallePorId;
