import 'leaflet/dist/leaflet.css';
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { CATALOGO, COORDENADAS_MUNICIPIO, rutaDetalle } from '../catalogo';

const MAXIMO_EN_LISTA = 8;

// Agrupa [{ seccion, registro }] por municipio, solo los que tienen coordenadas.
function agrupar(lugares) {
  const grupos = new Map();
  for (const lugar of lugares) {
    const municipio = lugar.registro.municipio;
    if (!COORDENADAS_MUNICIPIO[municipio]) continue;
    if (!grupos.has(municipio)) grupos.set(municipio, []);
    grupos.get(municipio).push(lugar);
  }
  return [...grupos].map(([municipio, items]) => ({ municipio, items, centro: COORDENADAS_MUNICIPIO[municipio] }));
}

// Mapa de OpenStreetMap con un circulo por municipio: el tamano dice cuanta
// oferta hay y al tocarlo se ve la lista con enlaces al detalle. La base no
// guarda coordenadas por lugar, por eso se agrupa por municipio.
function MapaMunicipios({ lugares, alto = 420, destacado }) {
  const grupos = agrupar(lugares);
  if (grupos.length === 0) return null;

  // Con un solo municipio no hay limites que ajustar: se centra en el.
  const vista = grupos.length === 1
    ? { center: grupos[0].centro, zoom: 11 }
    : { bounds: grupos.map((g) => g.centro), boundsOptions: { padding: [40, 40] } };

  return (
    <div className="st-mapa" style={{ height: alto }}>
      <MapContainer {...vista} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {grupos.map(({ municipio, items, centro }) => {
          const esDestacado = municipio === destacado;
          return (
            <CircleMarker
              key={municipio}
              center={centro}
              radius={9 + Math.sqrt(items.length) * 4}
              pathOptions={{
                color: '#fff',
                weight: 2,
                fillColor: esDestacado ? '#E8763A' : '#0077B6',
                fillOpacity: 0.85,
              }}
            >
              <Tooltip direction="top" offset={[0, -8]}>{municipio} · {items.length}</Tooltip>
              <Popup>
                <strong className="st-mapa-titulo">{municipio}</strong>
                <ul className="st-mapa-lista">
                  {items.slice(0, MAXIMO_EN_LISTA).map(({ seccion, registro }) => {
                    const Icono = CATALOGO[seccion].icono;
                    return (
                      <li key={`${seccion}-${registro.id}`}>
                        <Icono size={14} aria-hidden="true" />
                        <Link to={rutaDetalle(seccion, registro)}>{registro.nombre}</Link>
                      </li>
                    );
                  })}
                </ul>
                {items.length > MAXIMO_EN_LISTA && <small>y {items.length - MAXIMO_EN_LISTA} más</small>}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default MapaMunicipios;
