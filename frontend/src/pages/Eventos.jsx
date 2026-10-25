import { useState } from 'react';
import Chips from '../components/Chips';
import EncabezadoPagina from '../components/EncabezadoPagina';
import EstadoLista from '../components/EstadoLista';
import TarjetaEvento from '../components/TarjetaEvento';
import { useCatalogo, useMunicipios } from '../components/useCatalogo';

const TIPOS = [
  { valor: 'festival', etiqueta: 'Festivales' },
  { valor: 'feria', etiqueta: 'Ferias' },
  { valor: 'religioso', etiqueta: 'Religiosos' },
  { valor: 'cultural', etiqueta: 'Culturales' },
  { valor: 'deportivo', etiqueta: 'Deportivos' },
];

// Fecha local en formato AAAA-MM-DD, el que espera la API.
function hoy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function Eventos() {
  const [municipio, setMunicipio] = useState('');
  const [tipo, setTipo] = useState('');
  // Una agenda muestra lo que viene: por defecto, solo eventos desde hoy.
  const [desde, setDesde] = useState(hoy());
  const [hasta, setHasta] = useState('');
  const municipios = useMunicipios('/api/eventos');
  const { datos, cargando, error } = useCatalogo('/api/eventos', { municipio, tipo, desde, hasta });

  return (
    <>
      <EncabezadoPagina titulo="Eventos" descripcion="Festivales, ferias y la agenda cultural de Sucre." />
      <div className="container">
        <div className="st-filtros">
          <Chips etiqueta="Tipo de evento" opciones={TIPOS} valor={tipo} onChange={setTipo} />
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <select className="form-select" aria-label="Municipio" value={municipio} onChange={(e) => setMunicipio(e.target.value)}>
              <option value="">Todos los municipios</option>
              {municipios.map((m) => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
            </select>
            <label className="small text-muted" htmlFor="filtro-desde">Desde</label>
            <input id="filtro-desde" type="date" className="form-control w-auto" value={desde} onChange={(e) => setDesde(e.target.value)} />
            <label className="small text-muted" htmlFor="filtro-hasta">Hasta</label>
            <input id="filtro-hasta" type="date" className="form-control w-auto" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} />
          </div>
        </div>
        <EstadoLista nombre="eventos" cargando={cargando} error={error} vacio={datos.length === 0}>
          {datos.map((e) => <TarjetaEvento key={e.id} evento={e} />)}
        </EstadoLista>
        {!cargando && !error && datos.length === 0 && desde && (
          <p className="text-center">
            <button type="button" className="btn btn-link" onClick={() => { setDesde(''); setHasta(''); }}>Ver todos los eventos, también los pasados</button>
          </p>
        )}
      </div>
    </>
  );
}

export default Eventos;
