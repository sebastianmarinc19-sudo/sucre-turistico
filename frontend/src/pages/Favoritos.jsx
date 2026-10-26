import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CATALOGO } from '../catalogo';
import EncabezadoPagina from '../components/EncabezadoPagina';
import TarjetaDe from '../components/TarjetaDe';
import { useFavoritos } from '../favoritos';

function Favoritos() {
  const favoritos = useFavoritos();

  return (
    <>
      <EncabezadoPagina titulo="Mis favoritos" descripcion="Los lugares que guardaste con el corazón. Quedan en este dispositivo, sin crear cuenta." />
      <div className="container">
        {favoritos.length === 0 ? (
          <div className="st-vacio">
            <span className="st-vacio-icono"><Heart size={30} aria-hidden="true" /></span>
            <h2>Todavía no guardas nada</h2>
            <p>Toca el corazón de cualquier playa, hotel, restaurante o evento y aparecerá aquí para planear tu viaje.</p>
            <Link to="/destinos" className="btn btn-primary">Explorar destinos</Link>
          </div>
        ) : (
          Object.keys(CATALOGO).map((seccion) => {
            const deSeccion = favoritos.filter((f) => f.seccion === seccion);
            if (deSeccion.length === 0) return null;
            return (
              <section key={seccion} className="mb-5">
                <h2 className="h5 mb-3">{CATALOGO[seccion].titulo} <span className="text-muted fw-normal">· {deSeccion.length}</span></h2>
                <div className="row g-4">
                  {deSeccion.map(({ registro }) => <TarjetaDe key={registro.id} seccion={seccion} registro={registro} />)}
                </div>
              </section>
            );
          })
        )}
      </div>
    </>
  );
}

export default Favoritos;
