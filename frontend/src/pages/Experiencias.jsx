import { useState } from 'react';
import Chips from '../components/Chips';
import EncabezadoPagina from '../components/EncabezadoPagina';
import EstadoLista from '../components/EstadoLista';
import TarjetaExperiencia from '../components/TarjetaExperiencia';
import { useCatalogo, useMunicipios } from '../components/useCatalogo';

const TIPOS = [
  { valor: 'acuatica', etiqueta: 'Acuáticas' },
  { valor: 'ecoturismo', etiqueta: 'Ecoturismo' },
  { valor: 'cultural', etiqueta: 'Culturales' },
  { valor: 'aventura', etiqueta: 'Aventura' },
  { valor: 'gastronomica', etiqueta: 'Gastronómicas' },
];

const PRECIOS = [
  { valor: '50000', etiqueta: 'Hasta $50.000' },
  { valor: '100000', etiqueta: 'Hasta $100.000' },
  { valor: '200000', etiqueta: 'Hasta $200.000' },
];

function Experiencias() {
  const [municipio, setMunicipio] = useState('');
  const [tipo, setTipo] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const municipios = useMunicipios('/api/experiencias');
  const { datos, cargando, error } = useCatalogo('/api/experiencias', { municipio, tipo, precio_max: precioMax });

  return (
    <>
      <EncabezadoPagina titulo="Experiencias" descripcion="Paseos, recorridos y actividades para vivir el Golfo de Morrosquillo." />
      <div className="container">
        <div className="st-filtros">
          <Chips etiqueta="Tipo de experiencia" opciones={TIPOS} valor={tipo} onChange={setTipo} todos="Todas" />
          <div className="d-flex flex-wrap gap-2">
            <select className="form-select" aria-label="Municipio" value={municipio} onChange={(e) => setMunicipio(e.target.value)}>
              <option value="">Todos los municipios</option>
              {municipios.map((m) => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
            </select>
            <select className="form-select" aria-label="Precio por persona" value={precioMax} onChange={(e) => setPrecioMax(e.target.value)}>
              <option value="">Cualquier precio</option>
              {PRECIOS.map((p) => <option key={p.valor} value={p.valor}>{p.etiqueta}</option>)}
            </select>
          </div>
        </div>
        <EstadoLista nombre="experiencias" cargando={cargando} error={error} vacio={datos.length === 0}>
          {datos.map((x) => <TarjetaExperiencia key={x.id} experiencia={x} />)}
        </EstadoLista>
      </div>
    </>
  );
}

export default Experiencias;
