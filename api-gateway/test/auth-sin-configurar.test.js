// Este archivo NO define JWT_SECRET a proposito: comprueba que el gateway
// sobrevive a esa falta de configuracion en vez de caerse al arrancar.
// Va aparte de auth.test.js porque el runner de Node corre cada archivo en su
// propio proceso, y asi el secreto de aquel no se filtra a este.
delete process.env.JWT_SECRET;

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const express = require('express');
const { createApp } = require('../src/app');
const { crearRepoEnMemoria } = require('../src/auth/repo-en-memoria');

let upstream;
let url;
let server;

function escuchar(app) {
  return new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
}

before(async () => {
  const stub = express();
  stub.get('/api/destinos', (req, res) => res.json([{ id: 1, nombre: 'Playa Coveñas' }]));
  stub.post('/api/destinos', (req, res) => res.status(201).json({ ojo: 'esto NO deberia ejecutarse' }));
  upstream = await escuchar(stub);

  server = await escuchar(createApp({
    routes: { '/api/destinos': `http://127.0.0.1:${upstream.address().port}` },
    usuariosRepo: crearRepoEnMemoria(),
  }));
  url = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  upstream?.close();
  server?.close();
});

test('el gateway arranca sin JWT_SECRET en vez de morir', async () => {
  const res = await fetch(`${url}/health`);
  const body = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.status, 'ok');
});

test('el catalogo sigue publico: el turista puede consultar', async () => {
  const res = await fetch(`${url}/api/destinos`);
  const body = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(body[0].nombre, 'Playa Coveñas');
});

test('una escritura responde 503 y NO llega al microservicio', async () => {
  const res = await fetch(`${url}/api/destinos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: 'colado' }),
  });
  const body = await res.json();

  assert.strictEqual(res.status, 503);
  assert.match(body.error, /JWT_SECRET/);
});

test('el login responde 503 explicando el motivo real', async () => {
  const res = await fetch(`${url}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'a@b.co', password: 'loquesea' }),
  });
  const body = await res.json();

  assert.strictEqual(res.status, 503);
  assert.match(body.error, /no esta configurada/i);
});
