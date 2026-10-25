// Envoltorio de columna de las tarjetas. En una grilla cada tarjeta va en su
// columna de Bootstrap; dentro del carrusel no, porque ahi el ancho lo pone
// Swiper: se pasa columna={null}.
const POR_DEFECTO = 'col-12 col-sm-6 col-lg-4 col-xl-3';

function Columna({ clase = POR_DEFECTO, children }) {
  if (clase === null) return children;
  return <div className={clase}>{children}</div>;
}

export default Columna;
