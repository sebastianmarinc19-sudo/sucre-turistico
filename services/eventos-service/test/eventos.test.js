process.env.GATEWAY_SECRET = 'secreto-de-pruebas';

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
      headers: { 'Content-Type': 'application/json', 'X-Gateway-Secret': 'secreto-de-pruebas' },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
    return { status: res.status, body: await res.json() };
  } finally {
    server.close();
  }
}

const VALIDO = { nombre: 'Festival de prueba', municipio_id: 1, tipo: 'festival', fecha_inicio: '2026-12-01' };

test('GET /health responde ok', async () => {
  const { status, body } = await enviar('GET', '/health');
  assert.strictEqual(status, 200);
  assert.strictEqual(body.status, 'ok');
});

test('POST sin los campos obligatorios responde 400', async () => {
  const { status } = await enviar('POST', '/api/eventos', { nombre: 'Le falta todo lo demas' });
  assert.strictEqual(status, 400);
});

test('PUT sin los campos obligatorios responde 400', async () => {
  const { status } = await enviar('PUT', '/api/eventos/1', { nombre: 'Le falta todo lo demas' });
  assert.strictEqual(status, 400);
});

test('POST con un tipo que no existe responde 400', async () => {
  const { status, body } = await enviar('POST', '/api/eventos', { ...VALIDO, tipo: 'concierto' });
  assert.strictEqual(status, 400);
  assert.match(body.error, /tipo/);
});

test('POST con fecha_fin anterior a fecha_inicio responde 400', async () => {
  const { status, body } = await enviar('POST', '/api/eventos', { ...VALIDO, fecha_fin: '2026-11-30' });
  assert.strictEqual(status, 400);
  assert.match(body.error, /fecha_fin/);
});

test('GET con una fecha mal escrita en el filtro responde 400', async () => {
  const { status } = await enviar('GET', '/api/eventos?desde=01-12-2026');
  assert.strictEqual(status, 400);
});
