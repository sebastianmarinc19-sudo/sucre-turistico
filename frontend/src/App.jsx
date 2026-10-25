import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Destinos from './pages/Destinos';
import Alojamiento from './pages/Alojamiento';
import Gastronomia from './pages/Gastronomia';
import Experiencias from './pages/Experiencias';
import Eventos from './pages/Eventos';
import Login from './admin/Login';
import Panel from './admin/Panel';

function NoEncontrada() {
  return (
    <section className="text-center py-5">
      <h2 className="h3">Página no encontrada</h2>
      <p className="text-muted">La dirección que abriste no existe.</p>
      <NavLink to="/" className="btn btn-outline-secondary btn-sm">Ir a Destinos</NavLink>
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
          <NavLink to="/admin" className="small text-muted ms-auto">Administrar</NavLink>
        </div>
      </nav>

      <main className="container pb-5">
        <Routes>
          <Route path="/" element={<Destinos />} />
          <Route path="/alojamiento" element={<Alojamiento />} />
          <Route path="/gastronomia" element={<Gastronomia />} />
          <Route path="/experiencias" element={<Experiencias />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<Panel />} />
          <Route path="/admin/:entidad" element={<Panel />} />
          <Route path="*" element={<NoEncontrada />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
