import { useState } from 'react';
import Chips from '../components/Chips';
import EncabezadoPagina from '../components/EncabezadoPagina';
import EstadoLista from '../components/EstadoLista';
import TarjetaDestino from '../components/TarjetaDestino';
import { useCatalogo, useMunicipios } from '../components/useCatalogo';

const CATEGORIAS = [
  { valor: 'playa', etiqueta: 'Playas' },
  { valor: 'atractivo_natural', etiqueta: 'Naturaleza' },
  { valor: 'atractivo_cultural', etiqueta: 'Cultura' },
  { valor: 'lugar_turistico', etiqueta: 'Lugares turísticos' },
];

function Destinos() {
  const [municipio, setMunicipio] = useState('');
  const [categoria, setCategoria] = useState('');
  const municipios = useMunicipios('/api/destinos');
  const { datos, cargando, error } = useCatalogo('/api/destinos', { municipio, categoria });

  return (
    <>
      <EncabezadoPagina titulo="Destinos turísticos" descripcion="Playas, naturaleza y cultura del Golfo de Morrosquillo." />
      <div className="container">
        <div className="st-filtros">
          <Chips etiqueta="Categoría" opciones={CATEGORIAS} valor={categoria} onChange={setCategoria} />
          <select className="form-select" aria-label="Municipio" value={municipio} onChange={(e) => setMunicipio(e.target.value)}>
            <option value="">Todos los municipios</option>
            {municipios.map((m) => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
          </select>
        </div>
        <EstadoLista nombre="destinos" cargando={cargando} error={error} vacio={datos.length === 0}>
          {datos.map((d) => <TarjetaDestino key={d.id} destino={d} />)}
        </EstadoLista>
      </div>
    </>
  );
}

export default Destinos;
