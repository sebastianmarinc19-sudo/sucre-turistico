// Despierta los microservicios de Render al abrir la app.
//
// Los servicios gratis se duermen tras 15 min sin trafico. Si el API Gateway
// llama a uno dormido, Render le responde 429 al instante y NO lo despierta:
// la pagina se quedaria esperando para siempre. Una peticion desde el navegador
// si lo despierta, asi que al cargar la app se hace un ping a cada uno y los
// reintentos de client.js esperan a que terminen de arrancar.
//
// Es la unica excepcion a "todo pasa por el gateway": no lee datos, solo
// despierta. Si se agrega un microservicio en Render, agregarlo aqui.
const SERVICIOS = [
  'https://sucre-turistico-destinos-service.onrender.com',
  'https://sucre-turistico-alojamiento-service.onrender.com',
  'https://sucre-turistico-gastronomia-service.onrender.com',
  'https://sucre-turistico-experiencias-service.onrender.com',
  'https://sucre-turistico-eventos-service.onrender.com',
];

export function despertarServicios() {
  // En desarrollo los servicios corren en local y no duermen.
  if (!import.meta.env.PROD) return;
  for (const url of SERVICIOS) {
    // no-cors: no interesa la respuesta, solo que la peticion llegue.
    fetch(`${url}/health`, { mode: 'no-cors' }).catch(() => {});
  }
}
