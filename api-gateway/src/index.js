const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 4000;

const routes = {
  '/api/destinos': process.env.DESTINOS_URL || 'http://localhost:4001',
  '/api/alojamientos': process.env.ALOJAMIENTO_URL || 'http://localhost:4002',
  '/api/gastronomia': process.env.GASTRONOMIA_URL || 'http://localhost:4003',
  '/api/experiencias': process.env.EXPERIENCIAS_URL || 'http://localhost:4004',
  '/api/eventos': process.env.EVENTOS_URL || 'http://localhost:4005',
  '/api/buscador': process.env.BUSCADOR_URL || 'http://localhost:4006',
};

// Ojo: se monta con `app.use(middleware)` + `pathFilter`, NO con `app.use(ruta, middleware)`.
// Express recorta la ruta de montaje, así que con la segunda forma el microservicio
// recibía "/" en vez de "/api/destinos" y respondía 404 a todo el CRUD.
Object.entries(routes).forEach(([path, target]) => {
  app.use(createProxyMiddleware({ pathFilter: path, target, changeOrigin: true }));
});

app.get('/health', (req, res) => {
  res.json({ service: 'api-gateway', status: 'ok', routes: Object.keys(routes) });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no registrada en el API Gateway', ruta: req.originalUrl, rutasDisponibles: Object.keys(routes) });
});

app.listen(PORT, () => {
  console.log(`API Gateway escuchando en el puerto ${PORT}`);
});
