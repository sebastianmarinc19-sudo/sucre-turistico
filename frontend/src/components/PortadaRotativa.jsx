import 'swiper/css';
import 'swiper/css/effect-fade';
import { Autoplay, EffectFade } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { IMAGENES_PORTADA } from '../imagenes';

// Fondo de la portada: las fotos cambian con un fundido y cada una hace un
// zoom lento (efecto Ken Burns, en index.css). Si la persona pidio reducir
// el movimiento en su sistema, se queda quieta en la primera foto.
const sinMovimiento = typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function PortadaRotativa() {
  return (
    <Swiper
      className="st-portada"
      modules={[EffectFade, Autoplay]}
      effect="fade"
      fadeEffect={{ crossFade: true }}
      speed={1400}
      loop
      allowTouchMove={false}
      autoplay={sinMovimiento ? false : { delay: 6000, disableOnInteraction: false }}
      aria-hidden="true"
    >
      {IMAGENES_PORTADA.map((url, i) => (
        <SwiperSlide key={url}>
          {/* La primera llega rapido; las demas se piden despues. */}
          <img src={url} alt="" loading={i === 0 ? 'eager' : 'lazy'} fetchPriority={i === 0 ? 'high' : 'low'} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

export default PortadaRotativa;
