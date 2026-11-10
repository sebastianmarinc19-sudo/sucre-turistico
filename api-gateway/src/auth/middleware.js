const { verificar, haySecreto } = require('./tokens');

const SIN_CONFIGURAR = {
  error: 'La autenticacion no esta configurada en este servidor: falta la variable JWT_SECRET.',
};

// Lee y verifica el token del header. Devuelve { payload } o { status, error }.
function leerToken(req) {
  if (!haySecreto()) return { status: 503, error: SIN_CONFIGURAR.error };

  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    return { status: 401, error: 'Falta el token. Envia el header: Authorization: Bearer <token>' };
  }
  try {
    const payload = verificar(token);
    // Los tokens de antes de los roles no traen `rol`: hay que entrar de nuevo.
    if (!payload.rol) return { status: 401, error: 'Tu sesion es de una version anterior, vuelve a iniciar sesion' };
    return { payload };
  } catch (err) {
    const expirado = err.name === 'TokenExpiredError';
    return { status: 401, error: expirado ? 'El token expiro, vuelve a iniciar sesion' : 'Token invalido' };
  }
}

// Exige una sesion valida, de cualquier rol (superadmin o negocio).
function requiereSesion(req, res, next) {
  const { payload, status, error } = leerToken(req);
  if (!payload) return res.status(status).json({ error });
  req.usuario = payload;
  return next();
}

// Exige ser superadmin: crear cuentas de negocio, suspenderlas, etc.
function requiereSuperadmin(req, res, next) {
  return requiereSesion(req, res, () => {
    if (req.usuario.rol !== 'superadmin') {
      return res.status(403).json({ error: 'Solo el superadministrador puede hacer esto' });
    }
    return next();
  });
}

// En las lecturas el token es opcional: el turista consulta sin cuenta. Si
// viene uno valido, se reenvia al microservicio quien es (para que el panel
// de un negocio vea tambien sus fichas ocultas). Uno invalido se ignora.
function identificarSiHayToken(req, res, next) {
  if (req.headers.authorization) {
    const { payload } = leerToken(req);
    if (payload) req.usuario = payload;
  }
  next();
}

const SOLO_LECTURA = ['GET', 'HEAD', 'OPTIONS'];

// Los destinos (playas, reservas, iglesias) son informacion turistica general:
// solo los maneja el superadmin. Lo demas lo puede escribir un negocio, y
// cada microservicio revisa que solo toque lo suyo.
const SOLO_SUPERADMIN = ['/api/destinos'];

// Las escrituras exigen sesion, y ademas se revisa la cuenta en la base en
// cada una: asi una cuenta suspendida (o a la que le cambiaron el rol) queda
// bloqueada al instante, aunque su token siga vigente unas horas.
function protegerEscrituras(prefijos, repo) {
  const bajo = (lista, ruta) => lista.some((p) => ruta === p || ruta.startsWith(`${p}/`));

  return async (req, res, next) => {
    if (SOLO_LECTURA.includes(req.method) || !bajo(prefijos, req.path)) return next();

    const { payload, status, error } = leerToken(req);
    if (!payload) return res.status(status).json({ error });

    try {
      const cuenta = await repo.buscarPorId(payload.sub);
      if (!cuenta) return res.status(401).json({ error: 'La cuenta ya no existe, vuelve a iniciar sesion' });
      if (!cuenta.activo) return res.status(403).json({ error: 'Tu cuenta esta suspendida. Habla con el administrador del sitio.' });
      req.usuario = { ...payload, rol: cuenta.rol };
    } catch (err) {
      return res.status(500).json({ error: `No se pudo verificar la cuenta: ${err.message}` });
    }

    if (bajo(SOLO_SUPERADMIN, req.path) && req.usuario.rol !== 'superadmin') {
      return res.status(403).json({ error: 'Los destinos solo los maneja el superadministrador' });
    }
    return next();
  };
}

module.exports = { requiereSesion, requiereSuperadmin, identificarSiHayToken, protegerEscrituras, SIN_CONFIGURAR };
