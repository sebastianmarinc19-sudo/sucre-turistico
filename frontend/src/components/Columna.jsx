import { m } from 'motion/react';

// Envoltorio de columna de las tarjetas. En una grilla cada tarjeta va en su
// columna de Bootstrap y entra con una animacion suave al aparecer en
// pantalla; dentro del carrusel no, porque ahi el ancho lo pone Swiper: se
// pasa columna={null}.
const POR_DEFECTO = 'col-12 col-sm-6 col-lg-4 col-xl-3';

function Columna({ clase = POR_DEFECTO, children }) {
  if (clase === null) return children;
  return (
    <m.div
      className={clase}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </m.div>
  );
}

export default Columna;
