const express = require('express');
const bcrypt = require('bcryptjs');
const { firmar } = require('./tokens');
const { requiereAdmin, SIN_CONFIGURAR } = require('./middleware');
const { haySecreto } = require('./tokens');

const RONDAS_BCRYPT = 10;

// Algunos errores de mysql2 (por ejemplo, la base caida) llegan con `message` vacio
// y solo traen `code`. Sin esto el front recibe {"error":""} y nadie sabe que paso.
function mensajeDeError(err) {
  if (err?.code === 'ECONNREFUSED') {
    return 'No hay conexion con la base de datos. ¿Esta levantado MySQL? (npm run up)';
  }
  if (err?.code === 'ER_NO_SUCH_TABLE') {
    return 'Falta la tabla `usuarios`. Ver docs/AUTENTICACION.md';
  }
  return err?.message || err?.code || 'Error interno del gateway';
}

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
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: 'email y password son obligatorios' });
      }

      const usuario = await repo.buscarPorEmail(email);
      // Mismo mensaje para "no existe" y "clave mala": no le decimos a un atacante
      // cuales correos estan registrados.
      const ok = usuario && (await bcrypt.compare(password, usuario.password_hash));
      if (!ok) return res.status(401).json({ error: 'Credenciales invalidas' });

      return res.json({
        token: firmar(usuario),
        usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
      });
    } catch (err) {
      return res.status(500).json({ error: mensajeDeError(err) });
    }
  });

  // POST /api/auth/registro
  // Si todavia no hay ningun usuario, la primera cuenta se crea sin token y queda
  // como admin (asi arranca el sistema). A partir de ahi, solo un admin crea cuentas.
  router.post('/registro', async (req, res, next) => {
    try {
      const total = await repo.contar();
      if (total === 0) return next();
      return requiereAdmin(req, res, next);
    } catch (err) {
      return res.status(500).json({ error: mensajeDeError(err) });
    }
  }, async (req, res) => {
    try {
      const { nombre, email, password } = req.body || {};
      if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'nombre, email y password son obligatorios' });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: 'La contrasena debe tener al menos 8 caracteres' });
      }
      if (await repo.buscarPorEmail(email)) {
        return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
      }

      const passwordHash = await bcrypt.hash(password, RONDAS_BCRYPT);
      const creado = await repo.crear({ nombre, email, passwordHash, rol: 'admin' });
      return res.status(201).json(creado);
    } catch (err) {
      return res.status(500).json({ error: mensajeDeError(err) });
    }
  });

  // GET /api/auth/yo -> datos del usuario del token (util para el front)
  router.get('/yo', requiereAdmin, (req, res) => {
    res.json({ id: req.usuario.sub, nombre: req.usuario.nombre, email: req.usuario.email, rol: req.usuario.rol });
  });

  return router;
}

module.exports = { crearRutasAuth };
