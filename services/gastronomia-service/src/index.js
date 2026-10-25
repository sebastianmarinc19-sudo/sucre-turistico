const express = require('express');
const cors = require('cors');
const soloGateway = require('./solo-gateway');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(soloGateway);

const PORT = process.env.PORT || 4003;

app.get('/health', (req, res) => {
  res.json({ service: 'gastronomia-service', status: 'ok' });
});

// Todas las consultas hacen JOIN con municipios y renombran m.nombre a
// "municipio". Asi la API sigue devolviendo { municipio: "Covenas" } aunque
// en la tabla lo que se guarde sea un municipio_id.
const SELECT_BASE = `
  SELECT r.id, r.nombre, m.nombre AS municipio, r.municipio_id,
         r.tipo_cocina, r.descripcion, r.imagen_url, r.rango_precio,
         r.direccion, r.telefono
  FROM restaurantes r
  JOIN municipios m ON m.id = r.municipio_id
`;

// Listar restaurantes (con filtro opcional por municipio, tipo de cocina o rango de precio)
app.get('/api/gastronomia', async (req, res) => {
  try {
    const { municipio, tipo_cocina, rango_precio } = req.query;
    // activo = TRUE deja fuera los que se "borraron".
    let sql = `${SELECT_BASE} WHERE r.activo = TRUE`;
    const params = [];

    if (municipio) {
      sql += ' AND m.nombre = ?';
      params.push(municipio);
    }
    if (tipo_cocina) {
      sql += ' AND r.tipo_cocina = ?';
      params.push(tipo_cocina);
    }
    if (rango_precio) {
      sql += ' AND r.rango_precio = ?';
      params.push(rango_precio);
    }
    sql += ' ORDER BY r.id DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lista de municipios, para llenar el <select> del formulario del front.
// Va ANTES de /:id para que "catalogos" no se interprete como un id.
app.get('/api/gastronomia/catalogos/municipios', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre FROM municipios ORDER BY nombre');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener un restaurante por id
app.get('/api/gastronomia/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`${SELECT_BASE} WHERE r.id = ? AND r.activo = TRUE`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Restaurante no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear un restaurante nuevo
app.post('/api/gastronomia', async (req, res) => {
  try {
    const { nombre, municipio_id, tipo_cocina, descripcion, imagen_url, rango_precio, direccion, telefono } = req.body;
    if (!nombre || !municipio_id || !tipo_cocina) {
      return res.status(400).json({ error: 'nombre, municipio_id y tipo_cocina son obligatorios' });
    }
    const [result] = await pool.query(
      `INSERT INTO restaurantes (nombre, municipio_id, tipo_cocina, descripcion, imagen_url, rango_precio, direccion, telefono)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, municipio_id, tipo_cocina, descripcion || null, imagen_url || null, rango_precio || null, direccion || null, telefono || null]
    );
    res.status(201).json({ id: result.insertId, nombre, municipio_id, tipo_cocina, descripcion, imagen_url, rango_precio, direccion, telefono });
  } catch (err) {
    // Si mandan un municipio_id que no existe, MySQL rechaza la llave foranea.
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Ese municipio_id no existe' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Actualizar un restaurante
app.put('/api/gastronomia/:id', async (req, res) => {
  try {
    const { nombre, municipio_id, tipo_cocina, descripcion, imagen_url, rango_precio, direccion, telefono } = req.body;
    if (!nombre || !municipio_id || !tipo_cocina) {
      return res.status(400).json({ error: 'nombre, municipio_id y tipo_cocina son obligatorios' });
    }
    const [result] = await pool.query(
      `UPDATE restaurantes
       SET nombre=?, municipio_id=?, tipo_cocina=?, descripcion=?, imagen_url=?, rango_precio=?, direccion=?, telefono=?
       WHERE id=? AND activo=TRUE`,
      [nombre, municipio_id, tipo_cocina, descripcion || null, imagen_url || null, rango_precio || null, direccion || null, telefono || null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Restaurante no encontrado' });
    res.json({ id: Number(req.params.id), nombre, municipio_id, tipo_cocina, descripcion, imagen_url, rango_precio, direccion, telefono });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Ese municipio_id no existe' });
    }
    res.status(500).json({ error: err.message });
  }
});

// "Eliminar" un restaurante: no lo borra, lo marca como inactivo (soft delete).
app.delete('/api/gastronomia/:id', async (req, res) => {
  try {
    const [result] = await pool.query('UPDATE restaurantes SET activo = FALSE WHERE id = ? AND activo = TRUE', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Restaurante no encontrado' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Solo escucha si se ejecuta directamente (`npm start`), no al importarlo desde una prueba.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`gastronomia-service escuchando en el puerto ${PORT}`);
  });
}

module.exports = app;
