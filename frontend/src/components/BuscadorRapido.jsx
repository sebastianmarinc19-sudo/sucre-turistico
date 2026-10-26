import { Command } from 'cmdk';
import { ArrowRight, Heart, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { alPedirBuscador, normalizar } from '../buscadorRapido';
import { CATALOGO, etiquetaDe, rutaDetalle } from '../catalogo';
import { hoy } from '../fechas';

// Buscador instantaneo (Ctrl+K o la lupa). Filtra en el navegador sobre los
// cinco catalogos, asi que responde al tecleo y no depende de Elasticsearch.
// El buscador avanzado (/buscar, con facets) sigue estando para refinar.

// Todo el catalogo, una sola vez por visita y solo cuando se abre por primera vez.
let catalogoCompleto = null;
function cargarCatalogo() {
  catalogoCompleto ??= Promise.all(
    Object.entries(CATALOGO).map(([seccion, { endpoint }]) => api
      .get(endpoint, { params: seccion === 'eventos' ? { desde: hoy() } : undefined })
      .then(({ data }) => data.map((registro) => ({ seccion, registro })))
      .catch(() => []))
  ).then((listas) => listas.flat());
  return catalogoCompleto;
}

// Cada palabra buscada tiene que aparecer en el nombre, el municipio o la categoria.
function coincide(_valor, busqueda, palabrasClave = []) {
  const donde = normalizar(palabrasClave.join(' '));
  return normalizar(busqueda).split(/\s+/).filter(Boolean).every((p) => donde.includes(p)) ? 1 : 0;
}

function BuscadorRapido() {
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [lugares, setLugares] = useState(null);

  // Ctrl+K / Cmd+K, y los pedidos de abrir desde otros componentes.
  useEffect(() => {
    const atajo = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setAbierto((a) => !a);
      }
    };
    window.addEventListener('keydown', atajo);
    const dejar = alPedirBuscador((t) => { setTexto(t); setAbierto(true); });
    return () => { window.removeEventListener('keydown', atajo); dejar(); };
  }, []);

  useEffect(() => {
    if (abierto && !lugares) cargarCatalogo().then(setLugares);
  }, [abierto, lugares]);

  function ir(ruta) {
    setAbierto(false);
    setTexto('');
    navigate(ruta);
  }

  return (
    <Command.Dialog
      open={abierto}
      onOpenChange={setAbierto}
      label="Buscador rápido"
      filter={coincide}
      overlayClassName="st-cmd-fondo"
      contentClassName="st-cmd"
    >
      <div className="st-cmd-entrada">
        <Search size={18} aria-hidden="true" />
        <Command.Input value={texto} onValueChange={setTexto} placeholder="Busca playas, hoteles, restaurantes, eventos…" />
        <kbd>Esc</kbd>
      </div>
      <Command.List>
        {!lugares && <Command.Loading>Cargando el catálogo…</Command.Loading>}
        <Command.Empty>No encontramos nada con “{texto}”.</Command.Empty>

        {lugares && Object.entries(CATALOGO).map(([seccion, { titulo, icono: Icono }]) => {
          const deSeccion = lugares.filter((l) => l.seccion === seccion);
          if (deSeccion.length === 0) return null;
          return (
            <Command.Group key={seccion} heading={titulo}>
              {deSeccion.map(({ registro }) => (
                <Command.Item
                  key={registro.id}
                  value={`${seccion}-${registro.id}`}
                  keywords={[registro.nombre, registro.municipio, etiquetaDe(seccion, registro)]}
                  onSelect={() => ir(rutaDetalle(seccion, registro))}
                >
                  <span className="st-cmd-icono"><Icono size={16} aria-hidden="true" /></span>
                  <span className="st-cmd-texto">
                    <strong>{registro.nombre}</strong>
                    <small><MapPin size={11} aria-hidden="true" /> {registro.municipio} · {etiquetaDe(seccion, registro)}</small>
                  </span>
                  <ArrowRight size={15} className="st-cmd-flecha" aria-hidden="true" />
                </Command.Item>
              ))}
            </Command.Group>
          );
        })}

        <Command.Group heading="Ir a">
          {texto.trim() && (
            <Command.Item value="avanzado" keywords={[texto]} onSelect={() => ir(`/buscar?q=${encodeURIComponent(texto.trim())}`)}>
              <span className="st-cmd-icono"><SlidersHorizontal size={16} aria-hidden="true" /></span>
              <span className="st-cmd-texto"><strong>Búsqueda avanzada de “{texto.trim()}”</strong><small>Con filtros por municipio, tipo y precio</small></span>
            </Command.Item>
          )}
          <Command.Item value="favoritos" keywords={['favoritos', 'guardados', 'mis favoritos']} onSelect={() => ir('/favoritos')}>
            <span className="st-cmd-icono"><Heart size={16} aria-hidden="true" /></span>
            <span className="st-cmd-texto"><strong>Mis favoritos</strong></span>
          </Command.Item>
          {Object.entries(CATALOGO).map(([seccion, { titulo, ruta, icono: Icono }]) => (
            <Command.Item key={seccion} value={`ir-${seccion}`} keywords={[titulo, `ver ${titulo}`]} onSelect={() => ir(ruta)}>
              <span className="st-cmd-icono"><Icono size={16} aria-hidden="true" /></span>
              <span className="st-cmd-texto"><strong>Ver todo: {titulo}</strong></span>
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
      <div className="st-cmd-pie">
        <span><kbd>↑</kbd><kbd>↓</kbd> moverse</span>
        <span><kbd>Enter</kbd> abrir</span>
        <span><kbd>Ctrl</kbd>+<kbd>K</kbd> abrir o cerrar</span>
      </div>
    </Command.Dialog>
  );
}

export default BuscadorRapido;
