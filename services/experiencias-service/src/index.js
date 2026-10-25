const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4004;

const TIPOS = ['acuatica', 'cultural', 'ecoturismo', 'aventura', 'gastronomica'];

app.get('/health', (req, res) => {
  res.json({ service: 'experiencias-service', status: 'ok' });
});

const SELECT_BASE = `
  SELECT x.id, x.nombre, m.nombre AS municipio, x.municipio_id,
         x.tipo, x.descripcion, x.imagen_url, x.precio, x.duracion_horas, x.operador
  FROM experiencias x
  JOIN municipios m ON m.id = x.municipio_id
`;

// Devuelve un mensaje de error, o null si los datos sirven para guardar.
function validar({ nombre, municipio_id, tipo, precio, duracion_horas }) {
  if (!nombre || !municipio_id || !tipo) return 'nombre, municipio_id y tipo son obligatorios';
  if (!TIPOS.includes(tipo)) return `tipo debe ser uno de: ${TIPOS.join(', ')}`;
  if (precio != null && !(Number(precio) >= 0)) return 'precio debe ser un numero mayor o igual a 0';
  if (duracion_horas != null && !(Number(duracion_horas) > 0)) return 'duracion_horas debe ser un numero mayor que 0';
  return null;
}

// Listar experiencias (filtros opcionales: municipio, tipo y precio maximo).
app.get('/api/experiencias', async (req, res) => {
  try {
    const { municipio, tipo, precio_max } = req.query;
    let sql = `${SELECT_BASE} WHERE x.activo = TRUE`;
    const params = [];

    if (municipio) {
      sql += ' AND m.nombre = ?';
      params.push(municipio);
    }
    if (tipo) {
      sql += ' AND x.tipo = ?';
      params.push(tipo);
    }
    if (precio_max) {
      sql += ' AND x.precio <= ?';
      params.push(precio_max);
    }
    sql += ' ORDER BY x.id DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Va ANTES de /:id para que "catalogos" no se interprete como un id.
app.get('/api/experiencias/catalogos/municipios', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre FROM municipios ORDER BY nombre');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/experiencias/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`${SELECT_BASE} WHERE x.id = ? AND x.activo = TRUE`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Experiencia no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/experiencias', async (req, res) => {
  try {
    const error = validar(req.body);
    if (error) return res.status(400).json({ error });

    const { nombre, municipio_id, tipo, descripcion, imagen_url, precio, duracion_horas, operador } = req.body;
    const [result] = await pool.query(
      `INSERT INTO experiencias (nombre, municipio_id, tipo, descripcion, imagen_url, precio, duracion_horas, operador)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, municipio_id, tipo, descripcion || null, imagen_url || null, precio ?? null, duracion_horas ?? null, operador || null]
    );
    res.status(201).json({ id: result.insertId, nombre, municipio_id, tipo, descripcion, imagen_url, precio, duracion_horas, operador });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Ese municipio_id no existe' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/experiencias/:id', async (req, res) => {
  try {
    const error = validar(req.body);
    if (error) return res.status(400).json({ error });

    const { nombre, municipio_id, tipo, descripcion, imagen_url, precio, duracion_horas, operador } = req.body;
    const [result] = await pool.query(
      `UPDATE experiencias SET nombre=?, municipio_id=?, tipo=?, descripcion=?, imagen_url=?,
         precio=?, duracion_horas=?, operador=?
       WHERE id=? AND activo=TRUE`,
      [nombre, municipio_id, tipo, descripcion || null, imagen_url || null, precio ?? null, duracion_horas ?? null, operador || null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Experiencia no encontrada' });
    res.json({ id: Number(req.params.id), nombre, municipio_id, tipo, descripcion, imagen_url, precio, duracion_horas, operador });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Ese municipio_id no existe' });
    }
    res.status(500).json({ error: err.message });
  }
});

// "Eliminar" no borra la fila: la marca como inactiva (soft delete).
app.delete('/api/experiencias/:id', async (req, res) => {
  try {
    const [result] = await pool.query('UPDATE experiencias SET activo = FALSE WHERE id = ? AND activo = TRUE', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Experiencia no encontrada' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`experiencias-service escuchando en el puerto ${PORT}`);
  });
}

module.exports = app;
