import { CalendarDays, Ellipsis, House, MapPinned, Search, UserRound } from 'lucide-react';
import { useState } from 'react';
import Offcanvas from 'react-bootstrap/Offcanvas';
import { NavLink } from 'react-router-dom';
import { SECCIONES } from '../secciones';

const PESTANAS = [
  { ruta: '/', texto: 'Inicio', icono: House, exacta: true },
  { ruta: '/destinos', texto: 'Destinos', icono: MapPinned },
  { ruta: '/buscar', texto: 'Buscar', icono: Search },
  { ruta: '/eventos', texto: 'Eventos', icono: CalendarDays },
];

// Barra de navegacion fija abajo, solo en celular (como Airbnb o Rappi):
// lo mas usado a un toque, y el resto en el panel que se abre con "Mas".
function BarraInferior() {
  const [abierto, setAbierto] = useState(false);
  const cerrar = () => setAbierto(false);

  return (
    <>
      <nav className="st-barra-inferior" aria-label="Navegación principal">
        {PESTANAS.map(({ ruta, texto, icono: Icono, exacta }) => (
          <NavLink key={ruta} to={ruta} end={exacta}>
            <Icono size={22} aria-hidden="true" />
            <span>{texto}</span>
          </NavLink>
        ))}
        <button type="button" onClick={() => setAbierto(true)} aria-expanded={abierto}>
          <Ellipsis size={22} aria-hidden="true" />
          <span>Más</span>
        </button>
      </nav>

      <Offcanvas show={abierto} onHide={cerrar} placement="bottom" className="st-hoja">
        <Offcanvas.Header closeButton closeLabel="Cerrar">
          <Offcanvas.Title>Explorar</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <div className="st-hoja-grid">
            {SECCIONES.map(({ ruta, texto, icono: Icono }) => (
              <NavLink key={ruta} to={ruta} onClick={cerrar}>
                <Icono size={22} aria-hidden="true" /> {texto}
              </NavLink>
            ))}
            <NavLink to="/admin" onClick={cerrar}>
              <UserRound size={22} aria-hidden="true" /> Administrar
            </NavLink>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}

export default BarraInferior;
