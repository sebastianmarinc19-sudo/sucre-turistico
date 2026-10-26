import {
  ArrowLeft, BadgeCheck, Bath, BookOpen, CalendarDays, Check, Clock, Coffee, Compass, ConciergeBell, CookingPot,
  Fan, Info, Lock, Map as IconoMapa, MapPin, Phone, ShowerHead, Snowflake, SquareParking, Star, Tag, Tent,
  TriangleAlert, Users, Utensils, Wallet, Waves, Wifi,
} from 'lucide-react';
import { Expand, MessageCircle, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import api, { mensajeDeError } from '../api/client';
import { CATALOGO, categoriaDe, etiquetaDe, pesos, RANGOS_PRECIO } from '../catalogo';
import BotonFavorito from '../components/BotonFavorito';
import Carrusel from '../components/Carrusel';
import { AvisoDespertando } from '../components/Cargando';
import Clima from '../components/Clima';
import MapaMunicipios from '../components/MapaMunicipios';
import TarjetaDe from '../components/TarjetaDe';
import { useEsperaLarga } from '../components/useEsperaLarga';
import { hoy, rangoDeFechas } from '../fechas';
import { imagenDe } from '../imagenes';

const ICONOS_SERVICIO = {
  wifi: Wifi,
  piscina: Waves,
  aire_acondicionado: Snowflake,
  parqueadero: SquareParking,
  restaurante: Utensils,
  ventilador: Fan,
  cocina: CookingPot,
  desayuno: Coffee,
  lockers: Lock,
  banos: Bath,
  duchas: ShowerHead,
  alquiler_carpas: Tent,
};

const MAXIMO_RELACIONADOS = 8;

// Los datos de la ficha lateral de cada seccion: [icono, etiqueta, valor].
// Las filas sin valor no se muestran.
function datosClave(seccion, r) {
  const filas = {
    destinos: [
      [Tag, 'Categoría', etiquetaDe(seccion, r)],
    ],
    alojamiento: [
      [Tag, 'Tipo', etiquetaDe(seccion, r)],
      [Star, 'Categoría', r.estrellas > 0 ? `${r.estrellas} ${r.estrellas === 1 ? 'estrella' : 'estrellas'}` : null],
      [Users, 'Capacidad', r.capacidad ? `Hasta ${r.capacidad} personas` : null],
      [MapPin, 'Dirección', r.direccion],
      [Phone, 'Teléfono', r.telefono],
    ],
    gastronomia: [
      [Utensils, 'Cocina', etiquetaDe(seccion, r)],
      [Wallet, 'Precios', RANGOS_PRECIO[r.rango_precio]?.texto],
      [MapPin, 'Dirección', r.direccion],
      [Phone, 'Teléfono', r.telefono],
    ],
    experiencias: [
      [Tag, 'Tipo', etiquetaDe(seccion, r)],
      [Clock, 'Duración', r.duracion_horas != null ? `${Number(r.duracion_horas).toLocaleString('es-CO')} horas` : null],
      [BadgeCheck, 'Operador', r.operador],
    ],
    eventos: [
      [Tag, 'Tipo', etiquetaDe(seccion, r)],
      [CalendarDays, 'Fechas', rangoDeFechas(r.fecha_inicio, r.fecha_fin)],
      [MapPin, 'Lugar', r.lugar],
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
      <h2><BookOpen size={16} aria-hidden="true" /> Carta</h2>
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
      <h2><ConciergeBell size={16} aria-hidden="true" /> Servicios</h2>
      <ul className="st-servicios">
        {servicios.map((s) => {
          const Icono = ICONOS_SERVICIO[s] || Check;
          return <li key={s}><span><Icono size={16} aria-hidden="true" /></span> {s.replace(/_/g, ' ')}</li>;
        })}
      </ul>
    </section>
  );
}

// Menu nativo de compartir del celular; en computador, copia el enlace.
async function compartir(r) {
  const url = window.location.href;
  if (navigator.share) {
    try {
      await navigator.share({ title: r.nombre, text: `${r.nombre} en ${r.municipio}, Sucre`, url });
    } catch {
      // La persona cerro el menu de compartir: no es un error.
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success('Enlace copiado', { description: 'Pégalo donde quieras compartirlo.' });
  } catch {
    toast.error('No se pudo copiar el enlace');
  }
}

// Un celular colombiano: 10 digitos que empiezan por 3 (con o sin +57).
function celularDe(telefono) {
  const digitos = String(telefono || '').replace(/\D/g, '').replace(/^57(?=3\d{9}$)/, '');
  return /^3\d{9}$/.test(digitos) ? `57${digitos}` : null;
}

// Con celular registrado, abre el chat con el lugar; si no, para enviarle
// el enlace a alguien.
function enlaceWhatsApp(r) {
  const celular = celularDe(r.telefono);
  if (celular) {
    return `https://wa.me/${celular}?text=${encodeURIComponent(`Hola, vi ${r.nombre} en Sucre Turístico y quiero más información.`)}`;
  }
  return `https://wa.me/?text=${encodeURIComponent(`Mira ${r.nombre} en ${r.municipio}: ${window.location.href}`)}`;
}

function Detalle({ seccion }) {
  const { id } = useParams();
  const config = CATALOGO[seccion];

  const [registro, setRegistro] = useState(null);
  const [todos, setTodos] = useState([]);
  const [error, setError] = useState(null);
  const [noExiste, setNoExiste] = useState(false);
  const [fotoAbierta, setFotoAbierta] = useState(false);
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
    const Icono = noExiste ? Compass : TriangleAlert;
    return (
      <section className="container text-center py-5">
        <Icono size={48} className="mb-3 text-muted opacity-50" aria-hidden="true" />
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
  const foto = imagenDe(r, categoriaDe(seccion, r), 1600, 700);
  const precio = precioDestacado(seccion, r);
  const filas = datosClave(seccion, r);
  const otros = relacionados(seccion, r, todos);

  return (
    <>
      <header className="st-detalle-hero">
        <img src={foto} alt="" />
        <div className="st-detalle-capa" />
        <div className="container st-detalle-hero-contenido">
          <nav className="st-migas" aria-label="Ruta de navegación">
            <Link to="/">Inicio</Link> <span aria-hidden="true">›</span> <Link to={config.ruta}>{config.titulo}</Link> <span aria-hidden="true">›</span> {r.nombre}
          </nav>
          <span className="st-badge">{etiquetaDe(seccion, r)}</span>
          <h1>{r.nombre}</h1>
          <p><MapPin size={16} aria-hidden="true" /> {r.municipio}, Sucre</p>
          <div className="st-detalle-acciones">
            <BotonFavorito seccion={seccion} registro={r} grande />
            <button type="button" className="st-boton-vidrio" onClick={() => compartir(r)}>
              <Share2 size={17} aria-hidden="true" /> Compartir
            </button>
            <button type="button" className="st-boton-vidrio" onClick={() => setFotoAbierta(true)}>
              <Expand size={17} aria-hidden="true" /> Ver foto
            </button>
          </div>
        </div>
      </header>
      <Lightbox open={fotoAbierta} close={() => setFotoAbierta(false)} slides={[{ src: foto, alt: r.nombre }]}
        plugins={[Zoom]} render={{ buttonPrev: () => null, buttonNext: () => null }} carousel={{ finite: true }} />

      <div className="container py-4">
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <section className="st-detalle-bloque">
              <h2><Info size={16} aria-hidden="true" /> Descripción</h2>
              <p className="st-detalle-texto">{r.descripcion || 'Este lugar todavía no tiene descripción.'}</p>
            </section>
            {seccion === 'alojamiento' && <Servicios servicios={r.servicios} />}
            {seccion === 'gastronomia' && <Carta platos={r.platos} />}
            <section className="st-detalle-bloque">
              <h2><IconoMapa size={16} aria-hidden="true" /> Ubicación</h2>
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
                {filas.map(([Icono, etiqueta, valor]) => (
                  <div key={etiqueta}>
                    <dt><Icono size={14} aria-hidden="true" /> {etiqueta}</dt>
                    <dd>{valor}</dd>
                  </div>
                ))}
                <div>
                  <dt><MapPin size={16} aria-hidden="true" /> Municipio</dt>
                  <dd>{r.municipio}</dd>
                </div>
              </dl>
              <Clima municipio={r.municipio} variante="ficha" />
              <a className="btn st-btn-whatsapp w-100 mb-2" href={enlaceWhatsApp(r)} target="_blank" rel="noreferrer">
                <MessageCircle size={17} aria-hidden="true" /> {celularDe(r.telefono) ? 'Escribir por WhatsApp' : 'Enviar por WhatsApp'}
              </a>
              <Link to={config.ruta} className="btn btn-outline-primary w-100">
                <ArrowLeft size={16} aria-hidden="true" /> Volver a {config.titulo}
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
