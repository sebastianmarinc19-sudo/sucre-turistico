import { useState } from 'react';
import Chips from '../components/Chips';
import EncabezadoPagina from '../components/EncabezadoPagina';
import EstadoLista from '../components/EstadoLista';
import TarjetaRestaurante from '../components/TarjetaRestaurante';
import { useCatalogo, useMunicipios } from '../components/useCatalogo';

const COCINAS = [
  { valor: 'tipica', etiqueta: 'Típica' },
  { valor: 'mariscos', etiqueta: 'Mariscos' },
  { valor: 'internacional', etiqueta: 'Internacional' },
  { valor: 'comida_rapida', etiqueta: 'Comida rápida' },
  { valor: 'vegetariana', etiqueta: 'Vegetariana' },
];

const PRECIOS = [
  { valor: 'economico', etiqueta: 'Económico' },
  { valor: 'medio', etiqueta: 'Medio' },
  { valor: 'alto', etiqueta: 'Alto' },
];

function Gastronomia() {
  const [municipio, setMunicipio] = useState('');
  const [tipoCocina, setTipoCocina] = useState('');
  const [rangoPrecio, setRangoPrecio] = useState('');
  const municipios = useMunicipios('/api/gastronomia');
  const { datos, cargando, error } = useCatalogo('/api/gastronomia', { municipio, tipo_cocina: tipoCocina, rango_precio: rangoPrecio });

  return (
    <>
      <EncabezadoPagina titulo="Gastronomía" descripcion="Restaurantes y sabores típicos del Caribe sucreño." />
      <div className="container">
        <div className="st-filtros">
          <Chips etiqueta="Tipo de cocina" opciones={COCINAS} valor={tipoCocina} onChange={setTipoCocina} />
          <div className="d-flex flex-wrap gap-2">
            <select className="form-select" aria-label="Municipio" value={municipio} onChange={(e) => setMunicipio(e.target.value)}>
              <option value="">Todos los municipios</option>
              {municipios.map((m) => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
            </select>
            <select className="form-select" aria-label="Rango de precio" value={rangoPrecio} onChange={(e) => setRangoPrecio(e.target.value)}>
              <option value="">Cualquier precio</option>
              {PRECIOS.map((p) => <option key={p.valor} value={p.valor}>{p.etiqueta}</option>)}
            </select>
          </div>
        </div>
        <EstadoLista nombre="restaurantes" cargando={cargando} error={error} vacio={datos.length === 0}>
          {datos.map((r) => <TarjetaRestaurante key={r.id} restaurante={r} />)}
        </EstadoLista>
      </div>
    </>
  );
}

export default Gastronomia;
