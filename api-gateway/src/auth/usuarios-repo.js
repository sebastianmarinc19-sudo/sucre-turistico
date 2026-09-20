const pool = require('../db');

async function buscarPorEmail(email) {
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
  return rows[0] || null;
}

async function crear({ nombre, email, passwordHash, rol }) {
  const [res] = await pool.query(
    'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
    [nombre, email, passwordHash, rol]
  );
  return { id: res.insertId, nombre, email, rol };
}

async function contar() {
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM usuarios');
  return Number(rows[0].total);
}

module.exports = { buscarPorEmail, crear, contar };
