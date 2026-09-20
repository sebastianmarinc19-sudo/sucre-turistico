const { verificar, haySecreto } = require('./tokens');

const SIN_CONFIGURAR = {
  error: 'La autenticacion no esta configurada en este servidor: falta la variable JWT_SECRET.',
};

// Exige un token valido con rol de administrador.
function requiereAdmin(req, res, next) {
  // Va primero: sin secreto no se puede verificar nada, y un 503 explica el
  // problema real mucho mejor que un 401 diciendo "token invalido".
  if (!haySecreto()) return res.status(503).json(SIN_CONFIGURAR);

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

module.exports = { requiereAdmin, protegerEscrituras, SIN_CONFIGURAR };
