const express = require('express');
const bcrypt = require('bcryptjs');
const { firmar, haySecreto } = require('./tokens');
const { requiereSesion, requiereSuperadmin, SIN_CONFIGURAR } = require('./middleware');

const RONDAS_BCRYPT = 10;
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ['superadmin', 'negocio'];

// Algunos errores de mysql2 (por ejemplo, la base caida) llegan con `message` vacio
// y solo traen `code`. Sin esto el front recibe {"error":""} y nadie sabe que paso.
function mensajeDeError(err) {
  if (err?.code === 'ECONNREFUSED') {
    return 'No hay conexion con la base de datos. ¿Esta levantado MySQL? (npm run up)';
  }
  if (err?.code === 'ER_NO_SUCH_TABLE') {
    return 'Falta la tabla `usuarios`. Ver docs/AUTENTICACION.md';
  }
  if (err?.code === 'ER_BAD_FIELD_ERROR') {
    return 'Faltan las columnas de roles en `usuarios`: aplicar docs/sql/06-roles-negocios.sql';
  }
  return err?.message || err?.code || 'Error interno del gateway';
}

// Lo que se devuelve de una cuenta: nunca el hash de la contrasena.
const aPublico = (u) => ({
  id: u.id,
  nombre: u.nombre,
  email: u.email,
  rol: u.rol,
  activo: Boolean(u.activo),
  debe_cambiar_password: Boolean(u.debe_cambiar_password),
  ...(u.created_at ? { creado: u.created_at } : {}),
});

function validarNueva(password) {
  if (!password || password.length < 8) return 'La contrasena debe tener al menos 8 caracteres';
  return null;
}

// Envuelve un manejador async: cualquier error responde 500 con el motivo.
const seguro = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (err) {
    res.status(500).json({ error: mensajeDeError(err) });
  }
};

function crearRutasAuth(repo) {
  const router = express.Router();

  // express.json() va solo aqui, no global: el gateway NO debe parsear el body
  // de las rutas que reenvia por proxy, porque eso rompe los POST.
  router.use(express.json());

  // Sin secreto no tiene sentido intentar nada de esto: un 503 con el motivo
  // real es mas util que dejar que falle mas adelante de forma confusa.
  router.use((req, res, next) => {
    if (!haySecreto()) return res.status(503).json(SIN_CONFIGURAR);
    next();
  });

  // POST /api/auth/login  -> { token, usuario }
  router.post('/login', seguro(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email y password son obligatorios' });
    }

    const usuario = await repo.buscarPorEmail(email);
    // Mismo mensaje para "no existe" y "clave mala": no le decimos a un atacante
    // cuales correos estan registrados.
    const ok = usuario && (await bcrypt.compare(password, usuario.password_hash));
    if (!ok) return res.status(401).json({ error: 'Credenciales invalidas' });
    // Solo despues de comprobar la clave: si no, se sabria que el correo existe.
    if (!usuario.activo) return res.status(403).json({ error: 'Tu cuenta esta suspendida. Habla con el administrador del sitio.' });

    return res.json({ token: firmar(usuario), usuario: aPublico(usuario) });
  }));

  // POST /api/auth/registro
  // Si todavia no hay ninguna cuenta, la primera se crea sin token y es el
  // superadmin (asi arranca el sistema). Despues, solo el superadmin crea
  // cuentas: por defecto de negocio, con una contrasena temporal que hay que
  // cambiar al primer ingreso.
  router.post('/registro', seguro(async (req, res, next) => {
    if ((await repo.contar()) === 0) {
      req.primeraCuenta = true;
      return next();
    }
    return requiereSuperadmin(req, res, next);
  }), seguro(async (req, res) => {
    const { nombre, email, password } = req.body || {};
    const rol = req.primeraCuenta ? 'superadmin' : (req.body?.rol || 'negocio');

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'nombre, email y password son obligatorios' });
    }
    // El login del panel usa <input type="email">: una cuenta con un correo
    // sin formato valido no podria entrar nunca desde la web.
    if (!EMAIL_VALIDO.test(email)) {
      return res.status(400).json({ error: 'El email no tiene un formato valido' });
    }
    const problema = validarNueva(password);
    if (problema) return res.status(400).json({ error: problema });
    if (!ROLES.includes(rol)) return res.status(400).json({ error: `rol debe ser uno de: ${ROLES.join(', ')}` });
    if (await repo.buscarPorEmail(email)) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
    }

    const passwordHash = await bcrypt.hash(password, RONDAS_BCRYPT);
    // La que crea el superadmin para otro es temporal; la primera cuenta no.
    const creado = await repo.crear({ nombre, email, passwordHash, rol, debeCambiar: !req.primeraCuenta });
    return res.status(201).json(aPublico({ ...creado, activo: true, debe_cambiar_password: !req.primeraCuenta }));
  }));

  // GET /api/auth/yo -> datos de la cuenta, leidos de la base (no del token).
  router.get('/yo', requiereSesion, seguro(async (req, res) => {
    const cuenta = await repo.buscarPorId(req.usuario.sub);
    if (!cuenta) return res.status(401).json({ error: 'La cuenta ya no existe' });
    res.json(aPublico(cuenta));
  }));

  // POST /api/auth/cambiar-password { actual, nueva } — cualquier sesion.
  router.post('/cambiar-password', requiereSesion, seguro(async (req, res) => {
    const { actual, nueva } = req.body || {};
    if (!actual || !nueva) return res.status(400).json({ error: 'actual y nueva son obligatorias' });
    const problema = validarNueva(nueva);
    if (problema) return res.status(400).json({ error: problema });
    if (actual === nueva) return res.status(400).json({ error: 'La nueva contrasena debe ser distinta de la actual' });

    const cuenta = await repo.buscarPorEmail(req.usuario.email);
    if (!cuenta || !(await bcrypt.compare(actual, cuenta.password_hash))) {
      // 400 y no 401: el front trata cualquier 401 como sesion vencida y saca al usuario del panel.
      return res.status(400).json({ error: 'La contrasena actual no es correcta' });
    }
    await repo.cambiarPassword(cuenta.id, await bcrypt.hash(nueva, RONDAS_BCRYPT), false);
    res.json({ ok: true });
  }));

  // --- Solo superadmin: cuentas de los negocios ---

  // GET /api/auth/usuarios
  router.get('/usuarios', requiereSuperadmin, seguro(async (req, res) => {
    res.json((await repo.listar()).map(aPublico));
  }));

  // PATCH /api/auth/usuarios/:id { activo } — suspender o reactivar.
  router.patch('/usuarios/:id', requiereSuperadmin, seguro(async (req, res) => {
    const { activo } = req.body || {};
    if (typeof activo !== 'boolean') return res.status(400).json({ error: 'activo debe ser true o false' });
    if (Number(req.params.id) === Number(req.usuario.sub)) {
      return res.status(400).json({ error: 'No puedes suspender tu propia cuenta' });
    }
    if (!(await repo.cambiarActivo(req.params.id, activo))) return res.status(404).json({ error: 'Cuenta no encontrada' });
    res.json(aPublico(await repo.buscarPorId(req.params.id)));
  }));

  // POST /api/auth/usuarios/:id/restablecer { password } — nueva contrasena
  // temporal, para cuando un negocio olvida la suya.
  router.post('/usuarios/:id/restablecer', requiereSuperadmin, seguro(async (req, res) => {
    const problema = validarNueva(req.body?.password);
    if (problema) return res.status(400).json({ error: problema });
    const hash = await bcrypt.hash(req.body.password, RONDAS_BCRYPT);
    if (!(await repo.cambiarPassword(req.params.id, hash, true))) return res.status(404).json({ error: 'Cuenta no encontrada' });
    res.json({ ok: true });
  }));

  return router;
}

module.exports = { crearRutasAuth };
