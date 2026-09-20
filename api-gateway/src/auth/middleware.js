const { verificar } = require('./tokens');

// Exige un token valido con rol de administrador.
function requiereAdmin(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Falta el token. Envia el header: Authorization: Bearer <token>' });
  }

  let payload;
  try {
    payload = verificar(token);
  } catch (err) {
    const expirado = err.name === 'TokenExpiredError';
    return res.status(401).json({ error: expirado ? 'El token expiro, vuelve a iniciar sesion' : 'Token invalido' });
  }

  if (payload.rol !== 'admin') {
    return res.status(403).json({ error: 'Necesitas rol de administrador para esta operacion' });
  }

  req.usuario = payload;
  return next();
}

// Los turistas consultan sin iniciar sesion: solo las escrituras piden admin.
// Asi el catalogo queda publico y el panel de administracion, protegido.
const SOLO_LECTURA = ['GET', 'HEAD', 'OPTIONS'];

function protegerEscrituras(prefijos) {
  return (req, res, next) => {
    const esEscritura = !SOLO_LECTURA.includes(req.method);
    const vaAUnMicroservicio = prefijos.some((p) => req.path === p || req.path.startsWith(`${p}/`));

    if (!esEscritura || !vaAUnMicroservicio) return next();
    return requiereAdmin(req, res, next);
  };
}

module.exports = { requiereAdmin, protegerEscrituras };
