const pool = require('../db');

// La tabla `usuarios` guarda solo administradores: el turista no tiene cuenta.
// Por eso no hay columna ni concepto de rol por aqui.
async function buscarPorEmail(email) {
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
  return rows[0] || null;
}

async function crear({ nombre, email, passwordHash }) {
  const [res] = await pool.query(
    'INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, ?)',
    [nombre, email, passwordHash]
  );
  return { id: res.insertId, nombre, email };
}

async function contar() {
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM usuarios');
  return Number(rows[0].total);
}

module.exports = { buscarPorEmail, crear, contar };
