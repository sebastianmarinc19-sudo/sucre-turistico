import TarjetaAlojamiento from './TarjetaAlojamiento';
import TarjetaDestino from './TarjetaDestino';
import TarjetaEvento from './TarjetaEvento';
import TarjetaExperiencia from './TarjetaExperiencia';
import TarjetaRestaurante from './TarjetaRestaurante';

// La tarjeta que corresponde a cada seccion, para las vistas que mezclan o no
// saben de antemano que muestran (el detalle y su carrusel de relacionados).
function TarjetaDe({ seccion, registro, columna }) {
  switch (seccion) {
    case 'destinos': return <TarjetaDestino destino={registro} columna={columna} />;
    case 'alojamiento': return <TarjetaAlojamiento alojamiento={registro} columna={columna} />;
    case 'gastronomia': return <TarjetaRestaurante restaurante={registro} columna={columna} />;
    case 'experiencias': return <TarjetaExperiencia experiencia={registro} columna={columna} />;
    case 'eventos': return <TarjetaEvento evento={registro} columna={columna} />;
    default: return null;
  }
}

export default TarjetaDe;
