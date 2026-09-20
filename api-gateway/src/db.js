const mysql = require('mysql2/promise');

// Mismo patron que usan los microservicios (ver docs/GUIA_CRUD_PASO_A_PASO.md).
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? {} : undefined,
});

module.exports = pool;
