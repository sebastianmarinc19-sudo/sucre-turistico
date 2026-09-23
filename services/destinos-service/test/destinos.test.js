const { test } = require('node:test');
const assert = require('node:assert');
const app = require('../src/index');

// Levanta el servicio en un puerto libre (el 0 se lo pide al sistema operativo).
function escuchar() {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
  });
}

test('GET /health responde ok', async () => {
  const server = await escuchar();
  const res = await fetch(`http://127.0.0.1:${server.address().port}/health`);
  const body = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.status, 'ok');
  server.close();
});

test('POST sin los campos obligatorios responde 400', async () => {
  const server = await escuchar();
  const res = await fetch(`http://127.0.0.1:${server.address().port}/api/destinos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: 'Le falta municipio y categoria' }),
  });

  assert.strictEqual(res.status, 400);
  server.close();
});

test('PUT sin los campos obligatorios responde 400', async () => {
  const server = await escuchar();
  const res = await fetch(`http://127.0.0.1:${server.address().port}/api/destinos/1`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: 'Le falta municipio y categoria' }),
  });

  assert.strictEqual(res.status, 400);
  server.close();
});
