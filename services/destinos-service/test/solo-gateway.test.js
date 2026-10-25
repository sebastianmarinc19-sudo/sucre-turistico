const { test, afterEach } = require('node:test');
const assert = require('node:assert');
const express = require('express');
const soloGateway = require('../src/solo-gateway');

// solo-gateway.js es igual en los seis servicios: se prueba aqui una vez,
// montado en una app minima para no depender de la base de datos.
function escuchar() {
  const app = express();
  app.use(soloGateway);
  app.all('/api/destinos', (req, res) => res.json({ paso: true }));
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function pedir(method, headers = {}) {
  const server = await escuchar();
  const res = await fetch(`http://127.0.0.1:${server.address().port}/api/destinos`, { method, headers });
  server.close();
  return res;
}

afterEach(() => {
  delete process.env.GATEWAY_SECRET;
});

test('los GET siguen publicos, sin secreto', async () => {
  process.env.GATEWAY_SECRET = 'secreto-de-pruebas';
  const res = await pedir('GET');
  assert.strictEqual(res.status, 200);
});

test('una escritura sin la cabecera responde 403', async () => {
  process.env.GATEWAY_SECRET = 'secreto-de-pruebas';
  for (const metodo of ['POST', 'PUT', 'DELETE']) {
    const res = await pedir(metodo);
    assert.strictEqual(res.status, 403, metodo);
  }
});

test('una escritura con un secreto equivocado responde 403', async () => {
  process.env.GATEWAY_SECRET = 'secreto-de-pruebas';
  const res = await pedir('POST', { 'X-Gateway-Secret': 'secreto-de-prueba' });
  assert.strictEqual(res.status, 403);
});

test('una escritura con el secreto correcto pasa', async () => {
  process.env.GATEWAY_SECRET = 'secreto-de-pruebas';
  const res = await pedir('POST', { 'X-Gateway-Secret': 'secreto-de-pruebas' });
  assert.strictEqual(res.status, 200);
});

test('sin GATEWAY_SECRET configurado, las escrituras se rechazan (503)', async () => {
  const res = await pedir('POST', { 'X-Gateway-Secret': '' });
  const body = await res.json();
  assert.strictEqual(res.status, 503);
  assert.match(body.error, /GATEWAY_SECRET/);
});
