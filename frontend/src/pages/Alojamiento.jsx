import { useState } from 'react';
import Chips from '../components/Chips';
import EncabezadoPagina from '../components/EncabezadoPagina';
import EstadoLista from '../components/EstadoLista';
import TarjetaAlojamiento from '../components/TarjetaAlojamiento';
import { useCatalogo, useMunicipios } from '../components/useCatalogo';

const TIPOS = [
  { valor: 'hotel', etiqueta: 'Hoteles' },
  { valor: 'hostal', etiqueta: 'Hostales' },
  { valor: 'posada', etiqueta: 'Posadas' },
  { valor: 'cabana', etiqueta: 'Cabañas' },
  { valor: 'camping', etiqueta: 'Camping' },
];

const PRECIOS = [
  { valor: '100000', etiqueta: 'Hasta $100.000' },
  { valor: '200000', etiqueta: 'Hasta $200.000' },
  { valor: '400000', etiqueta: 'Hasta $400.000' },
];

function Alojamiento() {
  const [municipio, setMunicipio] = useState('');
  const [tipo, setTipo] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const municipios = useMunicipios('/api/alojamientos');
  const { datos, cargando, error } = useCatalogo('/api/alojamientos', { municipio, tipo, precio_max: precioMax });

  return (
    <>
      <EncabezadoPagina titulo="Alojamiento" descripcion="Hoteles, hostales, posadas y cabañas para tu estadía en el Caribe." />
      <div className="container">
        <div className="st-filtros">
          <Chips etiqueta="Tipo de alojamiento" opciones={TIPOS} valor={tipo} onChange={setTipo} />
          <div className="d-flex flex-wrap gap-2">
            <select className="form-select" aria-label="Municipio" value={municipio} onChange={(e) => setMunicipio(e.target.value)}>
              <option value="">Todos los municipios</option>
              {municipios.map((m) => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
            </select>
            <select className="form-select" aria-label="Precio por noche" value={precioMax} onChange={(e) => setPrecioMax(e.target.value)}>
              <option value="">Cualquier precio</option>
              {PRECIOS.map((p) => <option key={p.valor} value={p.valor}>{p.etiqueta}</option>)}
            </select>
          </div>
        </div>
        <EstadoLista nombre="alojamientos" cargando={cargando} error={error} vacio={datos.length === 0}>
          {datos.map((a) => <TarjetaAlojamiento key={a.id} alojamiento={a} />)}
        </EstadoLista>
      </div>
    </>
  );
}

export default Alojamiento;
