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

// La unica escritura publica: el turista pide una reserva sin cuenta
// (docs/sql/07-reservas.sql). El microservicio valida los datos y que la
// ficha este publicada; aqui solo se limita cuantas puede mandar cada IP.
const RESERVA_PUBLICA = /^\/api\/(alojamientos|gastronomia|experiencias)\/\d+\/reservas$/;
const MAX_RESERVAS = 5;
const VENTANA_MS = 15 * 60 * 1000;

// Limite en memoria, por IP: suficiente para frenar a alguien que llena el
// formulario en bucle. Se reinicia si el gateway se reinicia, y esta bien asi.
function crearLimitador({ max = MAX_RESERVAS, ventanaMs = VENTANA_MS } = {}) {
  const envios = new Map();
  return (ip) => {
    const ahora = Date.now();
    const recientes = (envios.get(ip) || []).filter((t) => ahora - t < ventanaMs);
    if (recientes.length >= max) return false;
    recientes.push(ahora);
    envios.set(ip, recientes);
    return true;
  };
}

// Las escrituras exigen sesion, y ademas se revisa la cuenta en la base en
// cada una: asi una cuenta suspendida (o a la que le cambiaron el rol) queda
// bloqueada al instante, aunque su token siga vigente unas horas.
function protegerEscrituras(prefijos, repo, limitar = crearLimitador()) {
  const bajo = (lista, ruta) => lista.some((p) => ruta === p || ruta.startsWith(`${p}/`));

  return async (req, res, next) => {
    if (SOLO_LECTURA.includes(req.method) || !bajo(prefijos, req.path)) return next();

    if (req.method === 'POST' && RESERVA_PUBLICA.test(req.path)) {
      if (!limitar(req.ip)) {
        return res.status(429).json({ error: 'Enviaste varias reservas seguidas. Espera unos minutos e intenta de nuevo.' });
      }
      return next();
    }

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

module.exports = {
  requiereSesion, requiereSuperadmin, identificarSiHayToken, protegerEscrituras, crearLimitador, SIN_CONFIGURAR,
};
