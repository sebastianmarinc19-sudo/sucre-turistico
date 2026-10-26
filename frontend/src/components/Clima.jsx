import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSun, Sun, Wind } from 'lucide-react';
import { useEffect, useState } from 'react';
import { COORDENADAS_MUNICIPIO } from '../catalogo';

// Clima actual de un municipio con Open-Meteo: gratis, sin cuenta ni clave,
// y permite llamarlo desde el navegador. Solo se le mandan las coordenadas
// del municipio. Si falla, el componente simplemente no se muestra: es un
// extra, no puede romper la pagina.

// Codigos WMO que devuelve Open-Meteo -> icono y texto.
function describir(codigo) {
  if (codigo === 0) return { Icono: Sun, texto: 'Despejado' };
  if (codigo <= 2) return { Icono: CloudSun, texto: 'Parcialmente nublado' };
  if (codigo === 3) return { Icono: Cloud, texto: 'Nublado' };
  if (codigo <= 48) return { Icono: CloudFog, texto: 'Neblina' };
  if (codigo <= 57) return { Icono: CloudDrizzle, texto: 'Llovizna' };
  if (codigo <= 82) return { Icono: CloudRain, texto: 'Lluvia' };
  return { Icono: CloudLightning, texto: 'Tormenta' };
}

// Una consulta por municipio por visita: el clima no cambia en minutos.
const enMemoria = new Map();

function pedirClima(municipio) {
  if (!enMemoria.has(municipio)) {
    const [lat, lng] = COORDENADAS_MUNICIPIO[municipio];
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}`
      + '&current=temperature_2m,weather_code,wind_speed_10m&timezone=America%2FBogota';
    const promesa = fetch(url, { signal: AbortSignal.timeout(8000) })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(({ current }) => ({
        temperatura: Math.round(current.temperature_2m),
        viento: Math.round(current.wind_speed_10m),
        ...describir(current.weather_code),
      }));
    // Si falla, se olvida para poder reintentar en la proxima pagina.
    promesa.catch(() => enMemoria.delete(municipio));
    enMemoria.set(municipio, promesa);
  }
  return enMemoria.get(municipio);
}

function Clima({ municipio, variante = 'pastilla' }) {
  const [clima, setClima] = useState(null);

  useEffect(() => {
    if (!COORDENADAS_MUNICIPIO[municipio]) return undefined;
    let cancelado = false;
    pedirClima(municipio).then((c) => { if (!cancelado) setClima(c); }).catch(() => {});
    return () => { cancelado = true; };
  }, [municipio]);

  if (!clima) return null;
  const { Icono, temperatura, texto, viento } = clima;

  if (variante === 'ficha') {
    return (
      <div className="st-clima-ficha">
        <Icono size={30} aria-hidden="true" />
        <div>
          <strong>{temperatura}°C · {texto}</strong>
          <small><Wind size={12} aria-hidden="true" /> Viento {viento} km/h · ahora en {municipio}</small>
        </div>
      </div>
    );
  }
  return (
    <span className="st-clima" title={`Clima actual en ${municipio}`}>
      <Icono size={16} aria-hidden="true" /> {municipio} hoy · <strong>{temperatura}°C</strong> {texto.toLowerCase()}
    </span>
  );
}

export default Clima;
