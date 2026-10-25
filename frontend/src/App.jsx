import { useEffect } from 'react';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import Encabezado from './components/Encabezado';
import PiePagina from './components/PiePagina';
import Inicio from './pages/Inicio';
import Destinos from './pages/Destinos';
import Alojamiento from './pages/Alojamiento';
import Gastronomia from './pages/Gastronomia';
import Experiencias from './pages/Experiencias';
import Eventos from './pages/Eventos';
import Buscador from './pages/Buscador';
import Login from './admin/Login';
import Panel from './admin/Panel';

function NoEncontrada() {
  return (
    <section className="container text-center py-5">
      <i className="fas fa-compass fa-3x mb-3 text-muted opacity-50" aria-hidden="true" />
      <h1 className="h3">Página no encontrada</h1>
      <p className="text-muted">La dirección que abriste no existe.</p>
      <Link to="/" className="btn btn-primary">Ir al inicio</Link>
    </section>
  );
}

// Al cambiar de pagina, volver arriba (si no, se queda en el scroll anterior).
function ArribaAlNavegar() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

const enContenedor = (elemento) => <div className="container py-4">{elemento}</div>;

function App() {
  return (
    <BrowserRouter>
      <ArribaAlNavegar />
      <Encabezado />
      <main className="st-main">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/destinos" element={<Destinos />} />
          <Route path="/alojamiento" element={<Alojamiento />} />
          <Route path="/gastronomia" element={<Gastronomia />} />
          <Route path="/experiencias" element={<Experiencias />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="/buscar" element={<Buscador />} />
          <Route path="/admin/login" element={enContenedor(<Login />)} />
          <Route path="/admin" element={enContenedor(<Panel />)} />
          <Route path="/admin/:entidad" element={enContenedor(<Panel />)} />
          <Route path="*" element={<NoEncontrada />} />
        </Routes>
      </main>
      <PiePagina />
    </BrowserRouter>
  );
}

export default App;
