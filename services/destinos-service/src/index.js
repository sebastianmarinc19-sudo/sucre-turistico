const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4001;

app.get('/health', (req, res) => {
  res.json({ service: 'destinos-service', status: 'ok' });
});

// Todas las consultas hacen JOIN con municipios y renombran m.nombre a
// "municipio". Asi la API sigue devolviendo { municipio: "Coveñas" } aunque
// en la tabla lo que se guarde sea un municipio_id: el front no cambia.
const SELECT_BASE = `
  SELECT d.id, d.nombre, m.nombre AS municipio, d.municipio_id,
         d.categoria, d.descripcion, d.imagen_url
  FROM destinos d
  JOIN municipios m ON m.id = d.municipio_id
`;

// Listar destinos (con filtro opcional por municipio o categoria)
app.get('/api/destinos', async (req, res) => {
  try {
    const { municipio, categoria } = req.query;
    // activo = TRUE deja fuera los que se "borraron".
    let sql = `${SELECT_BASE} WHERE d.activo = TRUE`;
    const params = [];

    if (municipio) {
      sql += ' AND m.nombre = ?';
      params.push(municipio);
    }
    if (categoria) {
      sql += ' AND d.categoria = ?';
      params.push(categoria);
    }
    sql += ' ORDER BY d.id DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lista de municipios, para llenar el <select> del formulario del front.
// Va ANTES de /:id para que "catalogos" no se interprete como un id.
app.get('/api/destinos/catalogos/municipios', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre FROM municipios ORDER BY nombre');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener un destino por id
app.get('/api/destinos/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`${SELECT_BASE} WHERE d.id = ? AND d.activo = TRUE`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Destino no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear un destino nuevo
app.post('/api/destinos', async (req, res) => {
  try {
    const { nombre, municipio_id, categoria, descripcion, imagen_url } = req.body;
    if (!nombre || !municipio_id || !categoria) {
      return res.status(400).json({ error: 'nombre, municipio_id y categoria son obligatorios' });
    }
    const [result] = await pool.query(
      'INSERT INTO destinos (nombre, municipio_id, categoria, descripcion, imagen_url) VALUES (?, ?, ?, ?, ?)',
      [nombre, municipio_id, categoria, descripcion || null, imagen_url || null]
    );
    res.status(201).json({ id: result.insertId, nombre, municipio_id, categoria, descripcion, imagen_url });
  } catch (err) {
    // Si mandan un municipio_id que no existe, MySQL rechaza la llave foranea.
    // Eso es culpa de quien llama, no del servidor: por eso 400 y no 500.
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Ese municipio_id no existe' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Actualizar un destino
app.put('/api/destinos/:id', async (req, res) => {
  try {
    const { nombre, municipio_id, categoria, descripcion, imagen_url } = req.body;
    if (!nombre || !municipio_id || !categoria) {
      return res.status(400).json({ error: 'nombre, municipio_id y categoria son obligatorios' });
    }
    const [result] = await pool.query(
      'UPDATE destinos SET nombre=?, municipio_id=?, categoria=?, descripcion=?, imagen_url=? WHERE id=? AND activo=TRUE',
      [nombre, municipio_id, categoria, descripcion || null, imagen_url || null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Destino no encontrado' });
    res.json({ id: Number(req.params.id), nombre, municipio_id, categoria, descripcion, imagen_url });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Ese municipio_id no existe' });
    }
    res.status(500).json({ error: err.message });
  }
});

// "Eliminar" un destino: no lo borra, lo marca como inactivo (soft delete).
app.delete('/api/destinos/:id', async (req, res) => {
  try {
    const [result] = await pool.query('UPDATE destinos SET activo = FALSE WHERE id = ? AND activo = TRUE', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Destino no encontrado' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Solo escucha si se ejecuta directamente (`npm start`), no al importarlo desde una prueba.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`destinos-service escuchando en el puerto ${PORT}`);
  });
}

module.exports = app;
