const { test } = require('node:test');
const assert = require('node:assert');
const { validar, hoyEnColombia } = require('../src/reservas');

// reservas.js es igual en alojamiento, gastronomia y experiencias: se prueba
// aqui una vez. Fechas relativas a hoy, para que la prueba no venza.
const dentroDe = (dias) => {
  const d = new Date(`${hoyEnColombia()}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
};
const BASE = { nombre_cliente: 'Ana Pérez', telefono: '300 123 4567', personas: 2, fecha_inicio: dentroDe(3) };

test('una reserva de alojamiento valida, con llegada y salida', () => {
  const { error, datos } = validar('alojamiento', { ...BASE, fecha_fin: dentroDe(5) });
  assert.strictEqual(error, undefined);
  assert.strictEqual(datos.fecha_fin, dentroDe(5));
  assert.strictEqual(datos.hora, null);
});

test('alojamiento: la salida es obligatoria y despues de la llegada', () => {
  assert.match(validar('alojamiento', BASE).error, /salida/);
  assert.match(validar('alojamiento', { ...BASE, fecha_fin: BASE.fecha_inicio }).error, /después de la llegada/);
  assert.match(validar('alojamiento', { ...BASE, fecha_fin: dentroDe(80) }).error, /máximo 60 noches/);
});

test('restaurante: la hora es obligatoria; experiencia: solo el dia', () => {
  assert.match(validar('restaurante', BASE).error, /hora/);
  assert.strictEqual(validar('restaurante', { ...BASE, hora: '19:30' }).datos.hora, '19:30');
  assert.strictEqual(validar('restaurante', { ...BASE, hora: '25:00' }).error, 'Elige la hora');
  assert.strictEqual(validar('experiencia', BASE).error, undefined);
});

test('rechaza fechas pasadas, telefonos raros y personas fuera de rango', () => {
  assert.match(validar('experiencia', { ...BASE, fecha_inicio: dentroDe(-1) }).error, /ya pasó/);
  assert.match(validar('experiencia', { ...BASE, telefono: '123' }).error, /teléfono/);
  assert.match(validar('experiencia', { ...BASE, personas: 0 }).error, /personas/);
  assert.match(validar('experiencia', { ...BASE, personas: 2.5 }).error, /personas/);
  assert.match(validar('experiencia', { ...BASE, email: 'no-es-correo' }).error, /correo/);
  assert.match(validar('experiencia', { ...BASE, nombre_cliente: ' ' }).error, /nombre/);
});

test('hoy si se puede reservar (la fecha se cuenta en hora de Colombia)', () => {
  assert.strictEqual(validar('experiencia', { ...BASE, fecha_inicio: hoyEnColombia() }).error, undefined);
});
