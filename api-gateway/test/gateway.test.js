process.env.JWT_SECRET = 'secreto-solo-para-pruebas';

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const express = require('express');
const { createApp } = require('../src/app');
const { crearRepoEnMemoria } = require('../src/auth/repo-en-memoria');
const { firmar } = require('../src/auth/tokens');

// Microservicio de mentiras que responde igual que lo hara destinos-service:
// devuelve la ruta que REALMENTE recibio, para poder afirmar que el gateway
// no la recorto por el camino.
let upstream;
let gateway;
let gatewayUrl;

function escuchar(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
  });
}

before(async () => {
  const stub = express();
  stub.use(express.json());
  stub.get('/api/destinos', (req, res) => res.json({ rutaRecibida: req.url.split('?')[0], filtros: req.query }));
  stub.get('/api/destinos/:id', (req, res) => res.json({ rutaRecibida: req.url, id: req.params.id }));
  stub.post('/api/destinos', (req, res) => res.status(201).json({ creado: req.body }));
  stub.use((req, res) => res.status(404).json({ error: 'el servicio no reconocio la ruta', rutaRecibida: req.url }));
  upstream = await escuchar(stub);

  const target = `http://127.0.0.1:${upstream.address().port}`;
  gateway = await escuchar(createApp({
    routes: { '/api/destinos': target },
    usuariosRepo: crearRepoEnMemoria(),
  }));
  gatewayUrl = `http://127.0.0.1:${gateway.address().port}`;
});

after(() => {
  upstream?.close();
  gateway?.close();
});

// Esta es la prueba de regresion del bug que rompia todo el CRUD:
// con `app.use('/api/destinos', proxy)` el servicio recibia "/" y devolvia 404.
test('reenvia la ruta completa al microservicio, sin recortar el prefijo', async () => {
  const res = await fetch(`${gatewayUrl}/api/destinos`);
  const body = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.rutaRecibida, '/api/destinos');
});

test('conserva los query params al reenviar', async () => {
  const res = await fetch(`${gatewayUrl}/api/destinos?municipio=Tol%C3%BA&categoria=playa`);
  const body = await res.json();

  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(body.filtros, { municipio: 'Tolú', categoria: 'playa' });
});

test('reenvia rutas con parametro, como /api/destinos/:id', async () => {
  const res = await fetch(`${gatewayUrl}/api/destinos/7`);
  const body = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.id, '7');
});

// El gateway NO usa express.json() a proposito: parsear el body aqui
// romperia el reenvio de los POST. Esta prueba lo deja fijado.
test('reenvia el body de un POST intacto', async () => {
  // Las escrituras exigen una cuenta (ver auth.test.js), por eso va el token.
  const token = firmar({ id: 1, nombre: 'Admin', email: 'admin@sucreturistico.co' });
  const res = await fetch(`${gatewayUrl}/api/destinos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ nombre: 'Playa Coveñas', municipio: 'Coveñas' }),
  });
  const body = await res.json();

  assert.strictEqual(res.status, 201);
  assert.deepStrictEqual(body.creado, { nombre: 'Playa Coveñas', municipio: 'Coveñas' });
});

test('/health responde sin pasar por los microservicios', async () => {
  const res = await fetch(`${gatewayUrl}/health`);
  const body = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.status, 'ok');
  assert.ok(body.routes.includes('/api/destinos'));
});

test('una ruta no registrada devuelve 404 en JSON, no el HTML de Express', async () => {
  const res = await fetch(`${gatewayUrl}/api/no-existe`);
  const body = await res.json();

  assert.strictEqual(res.status, 404);
  assert.match(body.error, /no registrada/i);
});
