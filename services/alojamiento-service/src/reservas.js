const { usuarioDe } = require('./propiedad');

// Reservaciones (docs/sql/07-reservas.sql). El turista pide una reserva sin
// cuenta; el dueno de la ficha (o el superadmin) la ve en su panel y la
// confirma o la rechaza.
//
//   POST  <ruta>/:id/reservas            publico (el gateway lo deja pasar sin token)
//   GET   <ruta>/reservas?estado=        panel: el superadmin todas, el negocio las de sus fichas
//   PATCH <ruta>/reservas/:reservaId     { estado }: confirmar, rechazar o volver a pendiente
//
// Esta copia es igual en alojamiento, gastronomia y experiencias; si la
// cambian, cambienla en las tres. Montarla ANTES de <ruta>/:id: si no,
// "reservas" se tomaria como un id.

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ESTADOS = ['pendiente', 'confirmada', 'rechazada'];
const MAX_NOCHES = 60;

// Fecha de hoy en Colombia (UTC-5, sin horario de verano), AAAA-MM-DD.
const hoyEnColombia = () => new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10);
const diasEntre = (a, b) => Math.round((new Date(`${b}T00:00:00Z`) - new Date(`${a}T00:00:00Z`)) / 86400000);

// Devuelve { error } o { datos } listos para guardar.
function validar(seccion, body = {}) {
  const nombre = String(body.nombre_cliente || '').trim();
  const telefono = String(body.telefono || '').trim();
  const digitos = telefono.replace(/\D/g, '');
  const email = String(body.email || '').trim();
  const personas = Number(body.personas);
  const { fecha_inicio: inicio, fecha_fin: fin, hora } = body;
  const mensaje = String(body.mensaje || '').trim();

  if (nombre.length < 2) return { error: 'Escribe tu nombre' };
  if (digitos.length < 7 || digitos.length > 15) return { error: 'Escribe un teléfono o WhatsApp válido' };
  if (email && !EMAIL.test(email)) return { error: 'El correo no tiene un formato válido' };
  if (!Number.isInteger(personas) || personas < 1 || personas > 50) return { error: 'El número de personas debe estar entre 1 y 50' };
  if (!FECHA.test(inicio || '')) return { error: 'Elige la fecha' };
  // Comparar como texto sirve: AAAA-MM-DD ordena igual que la fecha.
  if (inicio < hoyEnColombia()) return { error: 'La fecha ya pasó' };
  if (mensaje.length > 1000) return { error: 'El mensaje es muy largo (máximo 1.000 caracteres)' };

  if (seccion === 'alojamiento') {
    if (!FECHA.test(fin || '')) return { error: 'Elige la fecha de salida' };
    const noches = diasEntre(inicio, fin);
    if (noches < 1) return { error: 'La salida debe ser después de la llegada' };
    if (noches > MAX_NOCHES) return { error: `La estadía puede ser de máximo ${MAX_NOCHES} noches` };
  }
  if (seccion === 'restaurante' && !HORA.test(hora || '')) return { error: 'Elige la hora' };

  return {
    datos: {
      nombre_cliente: nombre.slice(0, 120),
      telefono: telefono.slice(0, 30),
      email: email || null,
      fecha_inicio: inicio,
      fecha_fin: seccion === 'alojamiento' ? fin : null,
      hora: seccion === 'restaurante' ? hora : null,
      personas,
      mensaje: mensaje || null,
    },
  };
}

function montarReservas(app, pool, { seccion, tabla, ruta }) {
  // --- Turista: pedir una reserva ---
  app.post(`${ruta}/:id/reservas`, async (req, res) => {
    try {
      const { error, datos } = validar(seccion, req.body);
      if (error) return res.status(400).json({ error });

      // Solo fichas que el turista puede ver: publicadas y de cuentas activas.
      const [fichas] = await pool.query(
        `SELECT t.id, t.nombre FROM ${tabla} t
         WHERE t.id = ? AND t.activo = TRUE AND t.publicado = TRUE
           AND (t.propietario_id IS NULL OR EXISTS (SELECT 1 FROM usuarios u WHERE u.id = t.propietario_id AND u.activo = TRUE))`,
        [req.params.id]
      );
      if (fichas.length === 0) return res.status(404).json({ error: 'Este lugar ya no recibe reservas' });

      const [resultado] = await pool.query(
        `INSERT INTO reservas (seccion, ficha_id, nombre_cliente, telefono, email, fecha_inicio, fecha_fin, hora, personas, mensaje)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [seccion, fichas[0].id, datos.nombre_cliente, datos.telefono, datos.email, datos.fecha_inicio, datos.fecha_fin, datos.hora, datos.personas, datos.mensaje]
      );
      return res.status(201).json({ id: resultado.insertId, estado: 'pendiente', ficha: fichas[0].nombre });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  // --- Panel: ver las reservas ---
  app.get(`${ruta}/reservas`, async (req, res) => {
    try {
      const usuario = usuarioDe(req);
      if (!usuario) return res.status(401).json({ error: 'Inicia sesión para ver las reservas' });

      let sql = `
        SELECT r.id, r.ficha_id, t.nombre AS ficha, r.nombre_cliente, r.telefono, r.email,
               DATE_FORMAT(r.fecha_inicio, '%Y-%m-%d') AS fecha_inicio,
               DATE_FORMAT(r.fecha_fin, '%Y-%m-%d') AS fecha_fin,
               TIME_FORMAT(r.hora, '%H:%i') AS hora,
               r.personas, r.mensaje, r.estado, r.created_at AS creada
        FROM reservas r
        JOIN ${tabla} t ON t.id = r.ficha_id
        WHERE r.seccion = ?`;
      const params = [seccion];
      if (usuario.rol !== 'superadmin') {
        sql += ' AND t.propietario_id = ?';
        params.push(usuario.id);
      }
      if (ESTADOS.includes(req.query.estado)) {
        sql += ' AND r.estado = ?';
        params.push(req.query.estado);
      }
      // Primero lo que hay que atender (pendientes), y dentro, lo mas proximo.
      sql += " ORDER BY r.estado = 'pendiente' DESC, r.fecha_inicio ASC, r.id DESC";

      const [filas] = await pool.query(sql, params);
      return res.json(filas.map((f) => ({ ...f, seccion })));
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  // --- Panel: confirmar o rechazar ---
  app.patch(`${ruta}/reservas/:reservaId`, async (req, res) => {
    try {
      const usuario = usuarioDe(req);
      if (!usuario) return res.status(401).json({ error: 'Inicia sesión para gestionar reservas' });
      if (!ESTADOS.includes(req.body?.estado)) return res.status(400).json({ error: `estado debe ser uno de: ${ESTADOS.join(', ')}` });

      const [filas] = await pool.query(
        `SELECT t.propietario_id FROM reservas r JOIN ${tabla} t ON t.id = r.ficha_id
         WHERE r.id = ? AND r.seccion = ?`,
        [req.params.reservaId, seccion]
      );
      if (filas.length === 0) return res.status(404).json({ error: 'Reserva no encontrada' });
      if (usuario.rol !== 'superadmin' && filas[0].propietario_id !== usuario.id) {
        return res.status(403).json({ error: 'Esta reserva es de otro negocio' });
      }

      await pool.query('UPDATE reservas SET estado = ? WHERE id = ?', [req.body.estado, req.params.reservaId]);
      return res.json({ id: Number(req.params.reservaId), estado: req.body.estado });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });
}

module.exports = { montarReservas, validar, hoyEnColombia };
