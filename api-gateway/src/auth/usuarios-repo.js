const pool = require('../db');

// Cuentas del panel: superadmin y negocios (ver docs/sql/06-roles-negocios.sql).
// El turista no tiene cuenta.
const COLUMNAS_PUBLICAS = 'id, nombre, email, rol, activo, debe_cambiar_password, created_at';

async function buscarPorEmail(email) {
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
  return rows[0] || null;
}

async function buscarPorId(id) {
  const [rows] = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM usuarios WHERE id = ?`, [id]);
  return rows[0] || null;
}

async function crear({ nombre, email, passwordHash, rol, debeCambiar = false }) {
  const [res] = await pool.query(
    'INSERT INTO usuarios (nombre, email, password_hash, rol, debe_cambiar_password) VALUES (?, ?, ?, ?, ?)',
    [nombre, email, passwordHash, rol, debeCambiar]
  );
  return { id: res.insertId, nombre, email, rol };
}

async function contar() {
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM usuarios');
  return Number(rows[0].total);
}

async function listar() {
  const [rows] = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM usuarios ORDER BY rol DESC, nombre`);
  return rows;
}

async function cambiarActivo(id, activo) {
  const [res] = await pool.query('UPDATE usuarios SET activo = ? WHERE id = ?', [activo, id]);
  return res.affectedRows > 0;
}

async function cambiarPassword(id, passwordHash, debeCambiar) {
  const [res] = await pool.query(
    'UPDATE usuarios SET password_hash = ?, debe_cambiar_password = ? WHERE id = ?',
    [passwordHash, debeCambiar, id]
  );
  return res.affectedRows > 0;
}

module.exports = { buscarPorEmail, buscarPorId, crear, contar, listar, cambiarActivo, cambiarPassword };
