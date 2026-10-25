import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { A11y, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

// Carrusel de tarjetas. Cada hijo es una diapositiva; las tarjetas se pasan
// con columna={null}, porque aqui el ancho lo decide Swiper.
function Carrusel({ children, etiqueta }) {
  const diapositivas = Array.isArray(children) ? children : [children];

  return (
    <div className="st-carrusel">
      <Swiper
        modules={[Navigation, Pagination, A11y]}
        navigation
        pagination={{ clickable: true }}
        spaceBetween={20}
        slidesPerView={1.15}
        breakpoints={{
          576: { slidesPerView: 2 },
          992: { slidesPerView: 3 },
          1200: { slidesPerView: 4 },
        }}
        a11y={{ containerMessage: etiqueta, prevSlideMessage: 'Anterior', nextSlideMessage: 'Siguiente' }}
      >
        {diapositivas.map((hijo) => <SwiperSlide key={hijo.key}>{hijo}</SwiperSlide>)}
      </Swiper>
    </div>
  );
}

export default Carrusel;
