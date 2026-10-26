import { ArrowRight, Search } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { abrirBuscadorRapido } from '../buscadorRapido';
import { CATALOGO } from '../catalogo';
import { TarjetasEsqueleto } from '../components/Cargando';
import Carrusel from '../components/Carrusel';
import Clima from '../components/Clima';
import PortadaRotativa from '../components/PortadaRotativa';
import TarjetaDestino from '../components/TarjetaDestino';
import TarjetaEvento from '../components/TarjetaEvento';
import { hoy } from '../fechas';

// Leaflet pesa: el mapa se descarga aparte, sin demorar el resto del inicio.
const MapaMunicipios = lazy(() => import('../components/MapaMunicipios'));

const CATEGORIAS = [
  { clave: 'destinos', seccion: 'destinos', endpoint: '/api/destinos', ruta: '/destinos', titulo: 'Destinos', color: 'azul', unidad: 'destinos' },
  { clave: 'alojamientos', seccion: 'alojamiento', endpoint: '/api/alojamientos', ruta: '/alojamiento', titulo: 'Alojamiento', color: 'cian', unidad: 'alojamientos' },
  { clave: 'gastronomia', seccion: 'gastronomia', endpoint: '/api/gastronomia', ruta: '/gastronomia', titulo: 'Gastronomía', color: 'naranja', unidad: 'restaurantes' },
  { clave: 'experiencias', seccion: 'experiencias', endpoint: '/api/experiencias', ruta: '/experiencias', titulo: 'Experiencias', color: 'morado', unidad: 'actividades' },
  { clave: 'eventos', seccion: 'eventos', endpoint: '/api/eventos', ruta: '/eventos', titulo: 'Eventos', color: 'verde', unidad: 'eventos' },
];

function Inicio() {
  // { destinos: [...], ... } a medida que llegan; undefined = cargando, null = fallo.
  const [listas, setListas] = useState({});

  useEffect(() => {
    let cancelado = false;
    for (const c of CATEGORIAS) {
      const params = c.clave === 'eventos' ? { desde: hoy() } : undefined;
      api.get(c.endpoint, { params })
        .then(({ data }) => { if (!cancelado) setListas((l) => ({ ...l, [c.clave]: data })); })
        .catch(() => { if (!cancelado) setListas((l) => ({ ...l, [c.clave]: null })); });
    }
    return () => { cancelado = true; };
  }, []);

  const cantidad = (clave) => (Array.isArray(listas[clave]) ? listas[clave].length : '—');
  const destinos = listas.destinos;
  const eventos = listas.eventos;
  // Todo lo que ya llego, para el mapa: cada seccion se suma al llegar.
  const lugares = CATEGORIAS.flatMap((c) => (Array.isArray(listas[c.clave]) ? listas[c.clave].map((registro) => ({ seccion: c.seccion, registro })) : []));
  const mapaListo = CATEGORIAS.every((c) => listas[c.clave] !== undefined);
  const mapaVacio = <div className="st-mapa st-esqueleto" style={{ height: 460 }} aria-hidden="true" />;

  return (
    <>
      <section className="st-hero">
        <PortadaRotativa />
        <div className="st-hero-capa" />
        <div className="st-hero-contenido">
          <Clima municipio="Coveñas" />
          <p className="st-hero-eyebrow">Golfo de Morrosquillo, Colombia</p>
          <h1>Descubre el Paraíso <span>Caribeño</span></h1>
          <p className="st-hero-sub">Planifica tu próxima aventura en el corazón del Caribe colombiano.</p>
          {/* Abre el buscador instantaneo: responde mientras se escribe. */}
          <button type="button" className="st-buscador-hero" onClick={() => abrirBuscadorRapido()}>
            <Search size={18} className="text-muted" aria-hidden="true" />
            <span className="st-buscador-hero-texto">¿A dónde quieres ir? Playas, hoteles, restaurantes…</span>
            <span className="st-buscador-hero-boton"><Search size={18} aria-hidden="true" /> <span>Buscar</span></span>
          </button>
          <div className="st-hero-stats">
            {CATEGORIAS.slice(0, 4).map((c) => (
              <div key={c.clave}><strong>{cantidad(c.clave)}</strong><span>{c.titulo}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="st-seccion">
        <div className="container">
          <div className="st-seccion-titulo">
            <div>
              <h2>Explorar por categoría</h2>
              <p>Encuentra exactamente lo que buscas en el Golfo de Morrosquillo.</p>
            </div>
          </div>
          <div className="row g-3 row-cols-2 row-cols-md-3 row-cols-lg-5">
            {CATEGORIAS.map((c) => {
              const Icono = CATALOGO[c.seccion].icono;
              return (
                <div className="col" key={c.clave}>
                  <Link to={c.ruta} className="st-categoria">
                    <span className={`st-categoria-icono ${c.color}`}><Icono size={26} strokeWidth={1.8} aria-hidden="true" /></span>
                    <strong>{c.titulo}</strong>
                    <span className="st-categoria-cantidad">{cantidad(c.clave)} {c.unidad}</span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="st-seccion">
        <div className="container">
          <div className="st-seccion-titulo">
            <div>
              <h2>Destinos destacados</h2>
              <p>Playas, naturaleza y cultura para tu próximo viaje.</p>
            </div>
            <Link to="/destinos" className="btn btn-outline-primary btn-sm">Ver todos <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
          {destinos === undefined && <TarjetasEsqueleto />}
          {destinos === null && <p className="text-muted">No se pudieron cargar los destinos en este momento.</p>}
          {Array.isArray(destinos) && (
            <Carrusel etiqueta="Destinos destacados">
              {destinos.map((d) => <TarjetaDestino key={d.id} destino={d} columna={null} />)}
            </Carrusel>
          )}
        </div>
      </section>

      <section className="st-seccion">
        <div className="container">
          <div className="st-seccion-titulo">
            <div>
              <h2>Explora el mapa</h2>
              <p>Cada círculo es un municipio: entre más grande, más para hacer. Tócalo para ver qué hay.</p>
            </div>
          </div>
          {/* El mapa espera a que respondan las cinco secciones: si se monta
              antes, se encuadra solo con las primeras que llegaron. */}
          <Suspense fallback={mapaVacio}>
            {mapaListo ? <MapaMunicipios lugares={lugares} alto={460} /> : mapaVacio}
          </Suspense>
        </div>
      </section>

      {Array.isArray(eventos) && eventos.length > 0 && (
        <section className="st-seccion">
          <div className="container">
            <div className="st-seccion-titulo">
              <div>
                <h2>Próximos eventos</h2>
                <p>Lo que viene en la agenda de la región.</p>
              </div>
              <Link to="/eventos" className="btn btn-outline-primary btn-sm">Ver agenda <ArrowRight size={15} aria-hidden="true" /></Link>
            </div>
            <div className="row g-4">
              {eventos.slice(0, 2).map((e) => <TarjetaEvento key={e.id} evento={e} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default Inicio;
