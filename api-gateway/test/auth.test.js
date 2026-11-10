process.env.JWT_SECRET = 'secreto-solo-para-pruebas';

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const express = require('express');
const bcrypt = require('bcryptjs');
const { createApp } = require('../src/app');
const { crearRepoEnMemoria } = require('../src/auth/repo-en-memoria');
const { firmar } = require('../src/auth/tokens');

const ADMIN = { nombre: 'Sebastian', email: 'admin@sucreturistico.co' };
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
  const routes = { '/api/destinos': microservicioUrl, '/api/alojamientos': microservicioUrl };
  const server = await escuchar(createApp({ routes, usuariosRepo: repo }));
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
  // Devuelve quien le dijo el gateway que hace la peticion.
  const quien = (req) => ({ usuario: req.get('x-usuario-id') || null, rol: req.get('x-usuario-rol') || null });
  stub.get('/api/alojamientos', (req, res) => res.json(quien(req)));
  stub.post('/api/alojamientos', (req, res) => res.status(201).json(quien(req)));
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
  assert.strictEqual(body.usuario.email, ADMIN.email);
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

  const token = firmar({ id: 1, ...ADMIN, rol: 'superadmin' });
  const res = await fetch(`${url}/api/destinos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ nombre: 'Playa Coveñas' }),
  });
  const body = await res.json();

  assert.strictEqual(res.status, 201);
  assert.deepStrictEqual(body.creado, { nombre: 'Playa Coveñas' });
});

test('borrar sin token devuelve 401', async (t) => {
  const { url, server } = await levantarGateway({ usuarios: await adminEnBase() });
  t.after(() => server.close());

  const res = await fetch(`${url}/api/destinos/1`, { method: 'DELETE' });

  assert.strictEqual(res.status, 401);
});

test('borrar con un token valido llega al microservicio', async (t) => {
  const { url, server } = await levantarGateway({ usuarios: await adminEnBase() });
  t.after(() => server.close());

  const token = firmar({ id: 1, ...ADMIN, rol: 'superadmin' });
  const res = await fetch(`${url}/api/destinos/1`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.strictEqual(res.status, 204);
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

test('la primera cuenta se crea sin token', async (t) => {
  const { url, server } = await levantarGateway({ usuarios: [] });
  t.after(() => server.close());

  const res = await fetch(`${url}/api/auth/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: 'Sebastian', email: ADMIN.email, password: CLAVE }),
  });
  const body = await res.json();

  assert.strictEqual(res.status, 201);
  assert.strictEqual(body.email, ADMIN.email);
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

// Paso de verdad: con las preguntas de crear-admin.js ocultas, se registro
// "12345678" como email y esa cuenta no podia entrar al panel.
test('un email sin formato valido se rechaza', async (t) => {
  const { url, server } = await levantarGateway({ usuarios: [] });
  t.after(() => server.close());

  const res = await fetch(`${url}/api/auth/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: 'Sebastian', email: '12345678', password: 'una-clave-larga' }),
  });
  const body = await res.json();

  assert.strictEqual(res.status, 400);
  assert.match(body.error, /email/i);
});

// --- Roles: superadmin y negocio ---

const NEGOCIO = { nombre: 'Hotel Mar', email: 'hotel@negocio.co' };

// Base con el superadmin (id 1) y un negocio (id 2), ambos con la misma clave.
async function adminYNegocio({ negocioActivo = true } = {}) {
  const hash = await bcrypt.hash(CLAVE, 10);
  return [
    { ...ADMIN, password_hash: hash },
    { ...NEGOCIO, password_hash: hash, rol: 'negocio', activo: negocioActivo },
  ];
}

const tokenNegocio = () => firmar({ id: 2, ...NEGOCIO, rol: 'negocio' });
const enviar = (url, metodo, token, body) => fetch(url, {
  method: metodo,
  headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  body: body ? JSON.stringify(body) : undefined,
});

test('un negocio no puede escribir destinos (solo el superadmin)', async (t) => {
  const { url, server } = await levantarGateway({ usuarios: await adminYNegocio() });
  t.after(() => server.close());

  const res = await enviar(`${url}/api/destinos`, 'POST', tokenNegocio(), { nombre: 'Playa' });
  assert.strictEqual(res.status, 403);
});

test('un negocio si llega a su microservicio, y el gateway le dice quien es', async (t) => {
  const { url, server } = await levantarGateway({ usuarios: await adminYNegocio() });
  t.after(() => server.close());

  const res = await enviar(`${url}/api/alojamientos`, 'POST', tokenNegocio(), { nombre: 'Hotel' });
  assert.strictEqual(res.status, 201);
  assert.deepStrictEqual(await res.json(), { usuario: '2', rol: 'negocio' });
});

test('las cabeceras de usuario que manda el cliente se descartan', async (t) => {
  const { url, server } = await levantarGateway({ usuarios: await adminYNegocio() });
  t.after(() => server.close());

  const res = await fetch(`${url}/api/alojamientos`, { headers: { 'X-Usuario-Id': '1', 'X-Usuario-Rol': 'superadmin' } });
  assert.deepStrictEqual(await res.json(), { usuario: null, rol: null });
});

test('una cuenta suspendida no puede escribir aunque su token siga vigente', async (t) => {
  const { url, server } = await levantarGateway({ usuarios: await adminYNegocio({ negocioActivo: false }) });
  t.after(() => server.close());

  const res = await enviar(`${url}/api/alojamientos`, 'POST', tokenNegocio(), { nombre: 'Hotel' });
  assert.strictEqual(res.status, 403);
});

test('una cuenta suspendida no puede iniciar sesion', async (t) => {
  const { url, server } = await levantarGateway({ usuarios: await adminYNegocio({ negocioActivo: false }) });
  t.after(() => server.close());

  const res = await enviar(`${url}/api/auth/login`, 'POST', null, { email: NEGOCIO.email, password: CLAVE });
  assert.strictEqual(res.status, 403);
});

test('un token de antes de los roles (sin rol) pide volver a entrar', async (t) => {
  const { url, server } = await levantarGateway({ usuarios: await adminEnBase() });
  t.after(() => server.close());

  const res = await enviar(`${url}/api/destinos`, 'POST', firmar({ id: 1, ...ADMIN }), { nombre: 'Playa' });
  assert.strictEqual(res.status, 401);
});

test('el superadmin crea una cuenta de negocio con contrasena temporal', async (t) => {
  const { url, server } = await levantarGateway({ usuarios: await adminEnBase() });
  t.after(() => server.close());

  const token = firmar({ id: 1, ...ADMIN, rol: 'superadmin' });
  const res = await enviar(`${url}/api/auth/registro`, 'POST', token, { nombre: 'Pargo Rojo', email: 'pargo@negocio.co', password: 'temporal-123' });
  const body = await res.json();

  assert.strictEqual(res.status, 201);
  assert.strictEqual(body.rol, 'negocio');
  assert.strictEqual(body.debe_cambiar_password, true);
});

test('un negocio no puede crear cuentas', async (t) => {
  const { url, server } = await levantarGateway({ usuarios: await adminYNegocio() });
  t.after(() => server.close());

  const res = await enviar(`${url}/api/auth/registro`, 'POST', tokenNegocio(), { nombre: 'Otro', email: 'otro@negocio.co', password: 'temporal-123' });
  assert.strictEqual(res.status, 403);
});

test('cambiar la contrasena exige la actual y quita el aviso de temporal', async (t) => {
  const usuarios = await adminYNegocio();
  usuarios[1].debe_cambiar_password = true;
  const { url, server } = await levantarGateway({ usuarios });
  t.after(() => server.close());

  const mala = await enviar(`${url}/api/auth/cambiar-password`, 'POST', tokenNegocio(), { actual: 'no-es-esta', nueva: 'nueva-clave-456' });
  assert.strictEqual(mala.status, 400);

  const buena = await enviar(`${url}/api/auth/cambiar-password`, 'POST', tokenNegocio(), { actual: CLAVE, nueva: 'nueva-clave-456' });
  assert.strictEqual(buena.status, 200);

  const login = await enviar(`${url}/api/auth/login`, 'POST', null, { email: NEGOCIO.email, password: 'nueva-clave-456' });
  assert.strictEqual((await login.json()).usuario.debe_cambiar_password, false);
});

test('el superadmin suspende y reactiva una cuenta, pero no la suya', async (t) => {
  const { url, server } = await levantarGateway({ usuarios: await adminYNegocio() });
  t.after(() => server.close());
  const token = firmar({ id: 1, ...ADMIN, rol: 'superadmin' });

  const suspendida = await enviar(`${url}/api/auth/usuarios/2`, 'PATCH', token, { activo: false });
  assert.strictEqual((await suspendida.json()).activo, false);

  const propia = await enviar(`${url}/api/auth/usuarios/1`, 'PATCH', token, { activo: false });
  assert.strictEqual(propia.status, 400);

  const negocioIntenta = await enviar(`${url}/api/auth/usuarios`, 'GET', tokenNegocio());
  assert.strictEqual(negocioIntenta.status, 403);
});

test('GET /api/auth/yo devuelve los datos del token', async (t) => {
  const { url, server } = await levantarGateway({ usuarios: await adminEnBase() });
  t.after(() => server.close());

  const token = firmar({ id: 1, ...ADMIN, rol: 'superadmin' });
  const res = await fetch(`${url}/api/auth/yo`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.email, ADMIN.email);
  assert.strictEqual(body.nombre, ADMIN.nombre);
});
