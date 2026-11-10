process.env.GATEWAY_SECRET = 'secreto-de-pruebas';

const { test } = require('node:test');
const assert = require('node:assert');
const { usuarioDe, filtroVisibilidad, propietarioAlCrear, permisoSobre } = require('../src/propiedad');

// propiedad.js es igual en los cuatro servicios con dueno: se prueba aqui una
// vez. Una peticion de mentira con las cabeceras que pone el gateway.
function peticion({ secreto = 'secreto-de-pruebas', id, rol, query = {} } = {}) {
  const cabeceras = { 'x-gateway-secret': secreto, 'x-usuario-id': id, 'x-usuario-rol': rol };
  return { query, get: (nombre) => cabeceras[nombre.toLowerCase()] };
}

// Pool falso: responde a SELECT propietario_id con la fila que se le diga.
const poolCon = (filas) => ({ query: async () => [filas] });

test('solo se cree en el usuario si viene el secreto del gateway', () => {
  assert.deepStrictEqual(usuarioDe(peticion({ id: '7', rol: 'negocio' })), { id: 7, rol: 'negocio' });
  assert.strictEqual(usuarioDe(peticion({ secreto: 'inventado', id: '1', rol: 'superadmin' })), null);
  assert.strictEqual(usuarioDe(peticion({ id: '1', rol: 'dios' })), null);
});

test('el turista, y cualquiera sin ?panel=1, solo ve lo publicado de cuentas activas', () => {
  for (const req of [peticion(), peticion({ id: '1', rol: 'superadmin' })]) {
    const { sql, params } = filtroVisibilidad(req, 'a');
    assert.match(sql, /a\.publicado = TRUE/);
    assert.match(sql, /u\.activo = TRUE/);
    assert.deepStrictEqual(params, []);
  }
});

test('en el panel, el superadmin ve todo y el negocio solo lo suyo', () => {
  assert.strictEqual(filtroVisibilidad(peticion({ id: '1', rol: 'superadmin', query: { panel: '1' } }), 'a').sql, '');

  const negocio = filtroVisibilidad(peticion({ id: '7', rol: 'negocio', query: { panel: '1' } }), 'a');
  assert.match(negocio.sql, /a\.propietario_id = \?/);
  assert.deepStrictEqual(negocio.params, [7]);
});

test('lo que crea un negocio es suyo aunque el formulario diga otro dueno', () => {
  assert.strictEqual(propietarioAlCrear({ id: 7, rol: 'negocio' }, { propietario_id: 99 }), 7);
  assert.strictEqual(propietarioAlCrear({ id: 1, rol: 'superadmin' }, { propietario_id: '7' }), 7);
  assert.strictEqual(propietarioAlCrear({ id: 1, rol: 'superadmin' }, {}), null);
});

test('permisos sobre una ficha: dueno, ajena, inexistente y superadmin', async () => {
  const deSiete = poolCon([{ propietario_id: 7 }]);
  assert.strictEqual(await permisoSobre(deSiete, 'alojamientos', 1, { id: 7, rol: 'negocio' }), 'ok');
  assert.strictEqual(await permisoSobre(deSiete, 'alojamientos', 1, { id: 8, rol: 'negocio' }), 'ajena');
  assert.strictEqual(await permisoSobre(deSiete, 'alojamientos', 1, { id: 1, rol: 'superadmin' }), 'ok');
  assert.strictEqual(await permisoSobre(deSiete, 'alojamientos', 1, null), 'ajena');
  assert.strictEqual(await permisoSobre(poolCon([]), 'alojamientos', 1, { id: 1, rol: 'superadmin' }), 'no-existe');
  // Una ficha sin dueno solo la toca el superadmin.
  assert.strictEqual(await permisoSobre(poolCon([{ propietario_id: null }]), 'alojamientos', 1, { id: 7, rol: 'negocio' }), 'ajena');
});
