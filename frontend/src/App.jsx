import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Destinos from './pages/Destinos';

// AVISO TEMPORAL — BORRAR antes de la entrega final y de grabar la videomemoria.
// Esta aqui para que quien clone el repo entienda de una que el proyecto esta
// a medias y cual es la pagina de ejemplo.
function AvisoDemo() {
  return (
    <div className="alert alert-info border-0 small mb-4" role="note">
      <strong>Proyecto en desarrollo.</strong> Solo <strong>Destinos</strong> esta
      implementada, y sirve de ejemplo del patron a seguir: mira{' '}
      <code>src/pages/Destinos.jsx</code> y <code>frontend/README.md</code>.
      Las demas secciones estan pendientes. Si Destinos muestra un error, es porque
      falta el CRUD de <code>destinos-service</code> en el back-end.
    </div>
  );
}

// Marcador de posicion para las paginas que aun no existen.
// Halit y Jaime las van reemplazando por paginas reales (ver SPRINT_PLAN.md).
function EnConstruccion({ titulo }) {
  return (
    <section>
      <h2 className="h3">{titulo}</h2>
      <div className="alert alert-light border mt-3">
        Esta pagina todavia no esta implementada. Sigue el patron de{' '}
        <code>src/pages/Destinos.jsx</code>.
      </div>
    </section>
  );
}

const ENLACES = [
  { ruta: '/', texto: 'Destinos', fin: true },
  { ruta: '/alojamiento', texto: 'Alojamiento' },
  { ruta: '/gastronomia', texto: 'Gastronomia' },
  { ruta: '/experiencias', texto: 'Experiencias' },
  { ruta: '/eventos', texto: 'Eventos' },
];

function App() {
  return (
    <BrowserRouter>
      <nav className="navbar navbar-expand-lg bg-body-tertiary border-bottom mb-4">
        <div className="container">
          <span className="navbar-brand fw-semibold">Sucre Turistico</span>
          <ul className="navbar-nav flex-row flex-wrap gap-3">
            {ENLACES.map(({ ruta, texto, fin }) => (
              <li className="nav-item" key={ruta}>
                <NavLink
                  to={ruta}
                  end={fin}
                  className={({ isActive }) => `nav-link p-0 ${isActive ? 'active fw-semibold' : ''}`}
                >
                  {texto}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <main className="container pb-5">
        <AvisoDemo />
        <Routes>
          <Route path="/" element={<Destinos />} />
          <Route path="/alojamiento" element={<EnConstruccion titulo="Alojamiento" />} />
          <Route path="/gastronomia" element={<EnConstruccion titulo="Gastronomia" />} />
          <Route path="/experiencias" element={<EnConstruccion titulo="Experiencias" />} />
          <Route path="/eventos" element={<EnConstruccion titulo="Eventos" />} />
          <Route path="*" element={<EnConstruccion titulo="Pagina no encontrada" />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
