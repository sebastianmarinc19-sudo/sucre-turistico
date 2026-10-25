const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? {} : undefined,
  // Devuelve las columnas DATE como "2026-08-14" y no como objeto Date: un Date
  // se serializa en UTC y, segun la zona horaria del servidor, puede correr la
  // fecha un dia.
  dateStrings: ['DATE'],
});

module.exports = pool;
