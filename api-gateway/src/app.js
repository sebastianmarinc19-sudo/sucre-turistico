const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { crearRutasAuth } = require('./auth/routes');
const { protegerEscrituras } = require('./auth/middleware');
const { avisarSiFaltaConfiguracion } = require('./auth/tokens');

// Las URLs de los microservicios salen del entorno (docker-compose las inyecta).
// Los valores por defecto sirven para correr el gateway suelto con `npm run dev`.
function buildRoutes(env = process.env) {
  return {
    '/api/destinos': env.DESTINOS_URL || 'http://localhost:4001',
    '/api/alojamientos': env.ALOJAMIENTO_URL || 'http://localhost:4002',
    '/api/gastronomia': env.GASTRONOMIA_URL || 'http://localhost:4003',
    '/api/experiencias': env.EXPERIENCIAS_URL || 'http://localhost:4004',
    '/api/eventos': env.EVENTOS_URL || 'http://localhost:4005',
    '/api/buscador': env.BUSCADOR_URL || 'http://localhost:4006',
  };
}

// Cabecera con la que los microservicios reconocen que una escritura viene del
// gateway (ver services/*/src/solo-gateway.js). Reemplaza cualquier valor que
// mande el cliente, asi que no se puede falsificar desde afuera.
function cabecerasHaciaServicios(env = process.env) {
  if (!env.GATEWAY_SECRET) {
    console.warn(
      '[api-gateway] AVISO: falta la variable GATEWAY_SECRET.\n' +
      '  Los microservicios van a rechazar las escrituras (crear, editar, borrar).'
    );
    // Vacia, para pisar igual la que pudiera mandar el cliente.
    return { 'x-gateway-secret': '' };
  }
  return { 'x-gateway-secret': env.GATEWAY_SECRET };
}

// `usuariosRepo` se puede inyectar para poder probar la autenticacion sin base de datos.
function createApp({ routes = buildRoutes(), usuariosRepo } = {}) {
  avisarSiFaltaConfiguracion();
  const headers = cabecerasHaciaServicios();

  const app = express();
  app.use(cors());

  const repo = usuariosRepo || require('./auth/usuarios-repo');
  app.use('/api/auth', crearRutasAuth(repo));

  // Los GET quedan publicos (el turista consulta sin cuenta); crear, editar y
  // borrar exigen un token de administrador. Va ANTES de los proxies.
  app.use(protegerEscrituras(Object.keys(routes)));

  // Ojo: se monta con `app.use(middleware)` + `pathFilter`, NO con `app.use(ruta, middleware)`.
  // Express recorta la ruta de montaje, asi que con la segunda forma el microservicio
  // recibia "/" en vez de "/api/destinos" y respondia 404 a todo el CRUD.
  Object.entries(routes).forEach(([path, target]) => {
    app.use(createProxyMiddleware({ pathFilter: path, target, changeOrigin: true, headers }));
  });

  app.get('/health', (req, res) => {
    res.json({ service: 'api-gateway', status: 'ok', routes: Object.keys(routes) });
  });

  app.use((req, res) => {
    res.status(404).json({
      error: 'Ruta no registrada en el API Gateway',
      ruta: req.originalUrl,
      rutasDisponibles: [...Object.keys(routes), '/api/auth'],
    });
  });

  return app;
}

module.exports = { createApp, buildRoutes };
