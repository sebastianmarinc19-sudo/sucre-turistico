import { ArrowRight, CalendarDays } from 'lucide-react';
import { m } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import 'swiper/css';
import 'swiper/css/effect-fade';
import { Autoplay, EffectFade } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { rutaDetalle } from '../catalogo';
import { aFecha } from '../fechas';
import Clima from './Clima';

// Portada con vistas tematicas que cambian solas: cada una con su foto,
// texto, boton, clima de su municipio y un dato real. Abajo quedan fijos el
// buscador y los contadores (children), que son lo que mas se usa.
//
// - Pausa con el mouse encima; en el celular se desliza con el dedo.
// - Avanza sola siempre (se pidio asi). Si el sistema pide reducir
//   movimiento, igual cambia, pero con un fundido simple: sin el zoom de la
//   foto (index.css) y sin el texto deslizandose (MotionConfig en App.jsx).

const DURACION_MS = 7000;

const foto = (id) => `https://images.unsplash.com/photo-${id}?w=1600&h=900&fit=crop&q=75`;

// Siempre son cuatro vistas: la del evento arranca generica y se completa
// cuando llega la agenda, sin cambiar la cantidad de diapositivas.
function armarVistas({ cantidades, evento }) {
  const fechaEvento = evento && aFecha(evento.fecha_inicio).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });
  return [
    {
      clave: 'playas',
      foto: foto('1507525428034-b723cf961d3e'),
      municipio: 'Coveñas',
      eyebrow: 'Golfo de Morrosquillo, Colombia',
      titulo: <>Descubre el Paraíso <span>Caribeño</span></>,
      texto: 'Playas de arena clara y agua tranquila en Coveñas, Tolú y Rincón del Mar.',
      boton: { texto: 'Ver destinos', ruta: '/destinos' },
      dato: cantidades.destinos != null ? `${cantidades.destinos} destinos para conocer` : null,
    },
    {
      clave: 'naturaleza',
      foto: foto('1510414842594-a61c69b5ae57'),
      municipio: 'San Onofre',
      eyebrow: 'Naturaleza viva',
      titulo: <>Manglares, ciénagas e <span>islas</span></>,
      texto: 'Recorre en canoa la Ciénaga de La Caimanera, haz snorkel en Isla Boquerón o avista aves en El Corchal.',
      boton: { texto: 'Ver experiencias', ruta: '/experiencias' },
      dato: cantidades.experiencias != null ? `${cantidades.experiencias} experiencias para vivir` : null,
    },
    {
      clave: 'sabores',
      foto: foto('1504674900247-0877df9cc836'),
      municipio: 'Santiago de Tolú',
      eyebrow: 'Sabores del Caribe',
      titulo: <>Mote de queso, pescado y <span>arroz de coco</span></>,
      texto: 'Cocina típica sucreña, mariscos frescos y restaurantes frente al mar.',
      boton: { texto: 'Dónde comer', ruta: '/gastronomia' },
      dato: cantidades.gastronomia != null ? `${cantidades.gastronomia} restaurantes recomendados` : null,
    },
    evento
      ? {
        clave: 'evento',
        foto: foto('1492684223066-81342ee5ff30'),
        municipio: evento.municipio,
        eyebrow: `Próximo evento · ${fechaEvento}`,
        titulo: <>{evento.nombre}</>,
        texto: evento.descripcion || `En ${evento.lugar || evento.municipio}.`,
        boton: { texto: 'Ver evento', ruta: rutaDetalle('eventos', evento) },
        dato: `${evento.lugar || evento.municipio} · ${fechaEvento}`,
        esEvento: true,
      }
      : {
        clave: 'evento',
        foto: foto('1492684223066-81342ee5ff30'),
        municipio: 'Sincelejo',
        eyebrow: 'Agenda cultural',
        titulo: <>Festivales y fiestas <span>todo el año</span></>,
        texto: 'Corralejas, gaitas, ferias artesanales y celebraciones religiosas.',
        boton: { texto: 'Ver agenda', ruta: '/eventos' },
        dato: null,
      },
  ];
}

// El texto de cada vista entra escalonado cuando la vista se activa.
const contenedor = { oculto: {}, visible: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } } };
const linea = {
  oculto: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

function PortadaTematica({ cantidades, evento, children }) {
  const vistas = armarVistas({ cantidades, evento });
  const [activa, setActiva] = useState(0);

  return (
    <section className="st-hero st-hero-tematica">
      <Swiper
        className="st-portada"
        modules={[EffectFade, Autoplay]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        speed={900}
        loop
        autoplay={{ delay: DURACION_MS, disableOnInteraction: false, pauseOnMouseEnter: true }}
        onSlideChange={(s) => setActiva(s.realIndex)}
      >
        {vistas.map((v, i) => (
          <SwiperSlide key={v.clave}>
            <img className="st-portada-foto" src={v.foto} alt="" loading={i === 0 ? 'eager' : 'lazy'} />
            <div className="st-hero-capa" />
            <m.div
              className="st-vista"
              variants={contenedor}
              initial="oculto"
              animate={activa === i ? 'visible' : 'oculto'}
              aria-hidden={activa !== i}
            >
              <m.div variants={linea}><Clima municipio={v.municipio} /></m.div>
              <m.p variants={linea} className="st-hero-eyebrow">
                {v.esEvento && <CalendarDays size={14} aria-hidden="true" />} {v.eyebrow}
              </m.p>
              <m.h1 variants={linea}>{v.titulo}</m.h1>
              <m.p variants={linea} className="st-hero-sub">{v.texto}</m.p>
              <m.div variants={linea} className="st-vista-acciones">
                <Link to={v.boton.ruta} className="st-vista-boton" tabIndex={activa === i ? 0 : -1}>
                  {v.boton.texto} <ArrowRight size={16} aria-hidden="true" />
                </Link>
                {v.dato && <span className="st-vista-dato">{v.dato}</span>}
              </m.div>
            </m.div>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="st-hero-fijo">
        {children}
      </div>
    </section>
  );
}

export default PortadaTematica;
