const { test } = require('node:test');
const assert = require('node:assert');
const app = require('../src/index');

// Puerto 0: el sistema operativo asigna uno libre.
function escuchar() {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function enviar(metodo, ruta, cuerpo) {
  const server = await escuchar();
  try {
    const res = await fetch(`http://127.0.0.1:${server.address().port}${ruta}`, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
    return { status: res.status, body: await res.json() };
  } finally {
    server.close();
  }
}

const VALIDO = { nombre: 'Paseo de prueba', municipio_id: 1, tipo: 'acuatica' };

test('GET /health responde ok', async () => {
  const { status, body } = await enviar('GET', '/health');
  assert.strictEqual(status, 200);
  assert.strictEqual(body.status, 'ok');
});

test('POST sin los campos obligatorios responde 400', async () => {
  const { status } = await enviar('POST', '/api/experiencias', { nombre: 'Le falta municipio y tipo' });
  assert.strictEqual(status, 400);
});

test('PUT sin los campos obligatorios responde 400', async () => {
  const { status } = await enviar('PUT', '/api/experiencias/1', { nombre: 'Le falta municipio y tipo' });
  assert.strictEqual(status, 400);
});

test('POST con un tipo que no existe responde 400', async () => {
  const { status, body } = await enviar('POST', '/api/experiencias', { ...VALIDO, tipo: 'paracaidismo' });
  assert.strictEqual(status, 400);
  assert.match(body.error, /tipo/);
});

test('POST con precio negativo responde 400', async () => {
  const { status, body } = await enviar('POST', '/api/experiencias', { ...VALIDO, precio: -5000 });
  assert.strictEqual(status, 400);
  assert.match(body.error, /precio/);
});
