const { test } = require('node:test');
const assert = require('node:assert');
const { construirBusqueda, construirSugerencias, POR_PAGINA } = require('../src/consultas');
const { aDocumento, FUENTES } = require('../src/indice');

const fuente = (tipo) => FUENTES.find((f) => f.tipo === tipo);

test('sin texto busca todo', () => {
  assert.deepStrictEqual(construirBusqueda({}).query, { match_all: {} });
});

test('con texto busca en nombre, municipio y descripcion, tolerando errores', () => {
  const { multi_match: mm } = construirBusqueda({ q: 'playa' }).query;
  assert.strictEqual(mm.query, 'playa');
  assert.strictEqual(mm.fuzziness, 'AUTO');
  assert.ok(mm.fields.includes('nombre^3'));
});

test('cada facet se cuenta sin su propio filtro, pero con los demas', () => {
  const b = construirBusqueda({ tipo: 'evento', municipio: 'Sincelejo' });
  assert.strictEqual(b.post_filter.bool.filter.length, 2);
  assert.deepStrictEqual(b.aggs.tipo.filter.bool.filter, [{ term: { municipio: 'Sincelejo' } }]);
  assert.deepStrictEqual(b.aggs.municipio.filter.bool.filter, [{ term: { tipo: 'evento' } }]);
});

test('el filtro de precio usa el rango elegido y ignora valores desconocidos', () => {
  const b = construirBusqueda({ precio: '50000-150000' });
  assert.deepStrictEqual(b.post_filter.bool.filter, [{ range: { precio: { gte: 50000, lt: 150000 } } }]);
  assert.deepStrictEqual(construirBusqueda({ precio: 'inventado' }).post_filter.bool.filter, []);
});

test('paginacion', () => {
  assert.strictEqual(construirBusqueda({ pagina: '3' }).from, 2 * POR_PAGINA);
  assert.strictEqual(construirBusqueda({ pagina: 'x' }).from, 0);
});

test('las sugerencias usan search_as_you_type', () => {
  const s = construirSugerencias('cov');
  assert.strictEqual(s.query.multi_match.type, 'bool_prefix');
  assert.ok(s.query.multi_match.fields.includes('nombre.sugerir'));
});

test('cada catalogo se convierte al mismo formato de documento', () => {
  const aloj = aDocumento(fuente('alojamiento'), { id: 4, nombre: 'Posada', municipio: 'Tolú', tipo: 'posada', precio_noche: '120000.00' });
  assert.deepStrictEqual(
    { tipo: aloj.tipo, categoria: aloj.categoria, precio: aloj.precio, ruta: aloj.ruta },
    { tipo: 'alojamiento', categoria: 'posada', precio: 120000, ruta: '/alojamiento' },
  );

  const destino = aDocumento(fuente('destino'), { id: 1, nombre: 'Playa', municipio: 'Coveñas', categoria: 'playa' });
  assert.strictEqual(destino.precio, null);

  const evento = aDocumento(fuente('evento'), { id: 2, nombre: 'Feria', tipo: 'feria', fecha_inicio: '2026-11-07', precio_entrada: null });
  assert.strictEqual(evento.fecha_inicio, '2026-11-07');
  assert.strictEqual(evento.precio, null);
});
