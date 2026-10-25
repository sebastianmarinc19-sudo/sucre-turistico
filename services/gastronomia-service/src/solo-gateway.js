const crypto = require('crypto');

// Las escrituras (POST, PUT, DELETE) solo se aceptan si vienen del API Gateway.
//
// Por que: en Render cada microservicio tiene su propia URL publica. El token
// de administrador lo revisa el gateway, asi que sin esto cualquiera podria
// saltarse el login llamando directo a https://...-service.onrender.com.
//
// Como: el gateway agrega la cabecera X-Gateway-Secret con un valor que solo
// el y los servicios conocen (variable GATEWAY_SECRET, la misma en todos).
// Los GET siguen publicos: el catalogo se consulta sin cuenta.
//
// Si a este servicio le falta GATEWAY_SECRET, las escrituras se rechazan
// (503): es mejor que el panel no pueda guardar a dejar el servicio abierto.
// Esta copia es igual en cada servicio; si la cambian, cambienla en todos.

const LECTURA = new Set(['GET', 'HEAD', 'OPTIONS']);

function iguales(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  // timingSafeEqual exige el mismo largo; compararlo aparte no revela el secreto.
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function soloGateway(req, res, next) {
  if (LECTURA.has(req.method)) return next();

  const secreto = process.env.GATEWAY_SECRET;
  if (!secreto) {
    return res.status(503).json({ error: 'Escrituras deshabilitadas: falta la variable GATEWAY_SECRET en este servicio' });
  }
  if (!iguales(req.get('x-gateway-secret') || '', secreto)) {
    return res.status(403).json({ error: 'Las escrituras solo se aceptan a traves del API Gateway' });
  }
  return next();
}

module.exports = soloGateway;
