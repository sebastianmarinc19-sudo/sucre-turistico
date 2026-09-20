process.env.JWT_SECRET = 'secreto-solo-para-pruebas';

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const express = require('express');
const bcrypt = require('bcryptjs');
const { createApp } = require('../src/app');
const { crearRepoEnMemoria } = require('../src/auth/repo-en-memoria');
const { firmar } = require('../src/auth/tokens');

const ADMIN = { nombre: 'Sebastian', email: 'admin@sucreturistico.co', rol: 'admin' };
const CLAVE = 'clave-super-segura';

let upstream;
let microservicioUrl;

function escuchar(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
  });
}

// Levanta un gateway con un repo de usuarios en memoria y devuelve su URL base.
async function levantarGateway({ usuarios = [] } = {}) {
  const repo = crearRepoEnMemoria(usuarios);
  const server = await escuchar(createApp({ routes: { '/api/destinos': microservicioUrl }, usuariosRepo: repo }));
  return { url: `http://127.0.0.1:${server.address().port}`, server };
}

async function adminEnBase() {
  return [{ ...ADMIN, password_hash: await bcrypt.hash(CLAVE, 10) }];
}

before(async () => {
  const stub = express();
  stub.use(express.json());
  stub.get('/api/destinos', (req, res) => res.json({ lista: [] }));
  stub.post('/api/destinos', (req, res) => res.status(201).json({ creado: req.body }));
  stub.delete('/api/destinos/:id', (req, res) => res.status(204).send());
  upstream = await escuchar(stub);
  microservicioUrl = `http://127.0.0.1:${upstream.address().port}`;
});

after(() => upstream?.close());

test('login con credenciales correctas devuelve un token', async (t) => {
  const { url, server } = await levantarGateway({ usuarios: await adminEnBase() });
  t.after(() => server.close());

  const res = await fetch(`${url}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN.email, password: CLAVE }),
  });
  const body = await res.json();

  assert.strictEqual(res.status, 200);
  assert.ok(body.token, 'deberia venir un token');
  assert.strictEqual(body.usuario.rol, 'admin');
  assert.strictEqual(body.usuario.password_hash, undefined, 'nunca devolver el hash');
});

test('login con contrasena incorrecta devuelve 401', async (t) => {
  const { url, server } = await levantarGateway({ usuarios: await adminEnBase() });
  t.after(() => server.close());

  const res = await fetch(`${url}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN.email, password: 'me-la-invente' }),
  });

  assert.strictEqual(res.status, 401);
});

test('un email inexistente da el mismo error que una clave mala', async (t) => {
  const { url, server } = await levantarGateway({ usuarios: await adminEnBase() });
  t.after(() => server.close());

  const res = await fetch(`${url}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'no-existe@sucreturistico.co', password: CLAVE }),
  });
  const body = await res.json();

  assert.strictEqual(res.status, 401);
  assert.strictEqual(body.error, 'Credenciales invalidas');
});

test('el turista puede consultar sin iniciar sesion', async (t) => {
  const { url, server } = await levantarGateway({ usuarios: await adminEnBase() });
  t.after(() => server.close());

  const res = await fetch(`${url}/api/destinos`);

  assert.strictEqual(res.status, 200);
});

test('crear un destino sin token devuelve 401', async (t) => {
  const { url, server } = await levantarGateway({ usuarios: await adminEnBase() });
  t.after(() => server.close());

  const res = await fetch(`${url}/api/destinos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: 'Playa Coveñas' }),
  });

  assert.strictEqual(res.status, 401);
});

test('crear un destino con token de admin llega al microservicio', async (t) => {
  const { url, server } = await levantarGateway({ usuarios: await adminEnBase() });
  t.after(() => server.close());

  const token = firmar({ id: 1, ...ADMIN });
  const res = await fetch(`${url}/api/destinos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ nombre: 'Playa Coveñas' }),
  });
  const body = await res.json();

  assert.strictEqual(res.status, 201);
  assert.deepStrictEqual(body.creado, { nombre: 'Playa Coveñas' });
});

test('borrar con un token que no es de admin devuelve 403', async (t) => {
  const { url, server } = await levantarGateway({ usuarios: await adminEnBase() });
  t.after(() => server.close());

  const token = firmar({ id: 2, nombre: 'Turista', email: 'turista@x.co', rol: 'turista' });
  const res = await fetch(`${url}/api/destinos/1`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.strictEqual(res.status, 403);
});

test('un token inventado devuelve 401', async (t) => {
  const { url, server } = await levantarGateway({ usuarios: await adminEnBase() });
  t.after(() => server.close());

  const res = await fetch(`${url}/api/destinos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer esto.no.es-un-token' },
    body: JSON.stringify({ nombre: 'X' }),
  });

  assert.strictEqual(res.status, 401);
});

test('la primera cuenta se crea sin token y queda como admin', async (t) => {
  const { url, server } = await levantarGateway({ usuarios: [] });
  t.after(() => server.close());

  const res = await fetch(`${url}/api/auth/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: 'Sebastian', email: ADMIN.email, password: CLAVE }),
  });
  const body = await res.json();

  assert.strictEqual(res.status, 201);
  assert.strictEqual(body.rol, 'admin');
});

test('ya existiendo un usuario, registrar otro sin token devuelve 401', async (t) => {
  const { url, server } = await levantarGateway({ usuarios: await adminEnBase() });
  t.after(() => server.close());

  const res = await fetch(`${url}/api/auth/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: 'Colado', email: 'colado@x.co', password: CLAVE }),
  });

  assert.strictEqual(res.status, 401);
});

test('una contrasena de menos de 8 caracteres se rechaza', async (t) => {
  const { url, server } = await levantarGateway({ usuarios: [] });
  t.after(() => server.close());

  const res = await fetch(`${url}/api/auth/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: 'Sebastian', email: ADMIN.email, password: '123' }),
  });

  assert.strictEqual(res.status, 400);
});

test('GET /api/auth/yo devuelve los datos del token', async (t) => {
  const { url, server } = await levantarGateway({ usuarios: await adminEnBase() });
  t.after(() => server.close());

  const token = firmar({ id: 1, ...ADMIN });
  const res = await fetch(`${url}/api/auth/yo`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.email, ADMIN.email);
  assert.strictEqual(body.rol, 'admin');
});
