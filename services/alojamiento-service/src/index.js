const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4002;

app.get('/health', (req, res) => {
  res.json({ service: 'alojamiento-service', status: 'ok' });
});

// Todas las consultas hacen JOIN con municipios y renombran m.nombre a
// "municipio". Asi la API sigue devolviendo { municipio: "Covenas" } aunque
// en la tabla lo que se guarde sea un municipio_id.
const SELECT_BASE = `
  SELECT a.id, a.nombre, m.nombre AS municipio, a.municipio_id,
         a.tipo, a.descripcion, a.imagen_url, a.precio_noche, a.capacidad,
         a.estrellas, a.direccion, a.telefono, a.servicios
  FROM alojamientos a
  JOIN municipios m ON m.id = a.municipio_id
`;

// Listar alojamientos (con filtro opcional por municipio, tipo o precio maximo)
app.get('/api/alojamientos', async (req, res) => {
  try {
    const { municipio, tipo, precio_max } = req.query;
    // activo = TRUE deja fuera los que se "borraron".
    let sql = `${SELECT_BASE} WHERE a.activo = TRUE`;
    const params = [];

    if (municipio) {
      sql += ' AND m.nombre = ?';
      params.push(municipio);
    }
    if (tipo) {
      sql += ' AND a.tipo = ?';
      params.push(tipo);
    }
    if (precio_max) {
      sql += ' AND a.precio_noche <= ?';
      params.push(precio_max);
    }
    sql += ' ORDER BY a.id DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lista de municipios, para llenar el <select> del formulario del front.
// Va ANTES de /:id para que "catalogos" no se interprete como un id.
app.get('/api/alojamientos/catalogos/municipios', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre FROM municipios ORDER BY nombre');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener un alojamiento por id
app.get('/api/alojamientos/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`${SELECT_BASE} WHERE a.id = ? AND a.activo = TRUE`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Alojamiento no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear un alojamiento nuevo
app.post('/api/alojamientos', async (req, res) => {
  try {
    const {
      nombre, municipio_id, tipo, descripcion, imagen_url,
      precio_noche, capacidad, estrellas, direccion, telefono, servicios,
    } = req.body;
    if (!nombre || !municipio_id || !tipo) {
      return res.status(400).json({ error: 'nombre, municipio_id y tipo son obligatorios' });
    }
    const [result] = await pool.query(
      `INSERT INTO alojamientos
        (nombre, municipio_id, tipo, descripcion, imagen_url, precio_noche, capacidad, estrellas, direccion, telefono, servicios)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre, municipio_id, tipo, descripcion || null, imagen_url || null,
        precio_noche || null, capacidad || null, estrellas || null,
        direccion || null, telefono || null,
        servicios ? JSON.stringify(servicios) : null,
      ]
    );
    res.status(201).json({
      id: result.insertId, nombre, municipio_id, tipo, descripcion, imagen_url,
      precio_noche, capacidad, estrellas, direccion, telefono, servicios,
    });
  } catch (err) {
    // Si mandan un municipio_id que no existe, MySQL rechaza la llave foranea.
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Ese municipio_id no existe' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Actualizar un alojamiento
app.put('/api/alojamientos/:id', async (req, res) => {
  try {
    const {
      nombre, municipio_id, tipo, descripcion, imagen_url,
      precio_noche, capacidad, estrellas, direccion, telefono, servicios,
    } = req.body;
    if (!nombre || !municipio_id || !tipo) {
      return res.status(400).json({ error: 'nombre, municipio_id y tipo son obligatorios' });
    }
    const [result] = await pool.query(
      `UPDATE alojamientos
       SET nombre=?, municipio_id=?, tipo=?, descripcion=?, imagen_url=?, precio_noche=?,
           capacidad=?, estrellas=?, direccion=?, telefono=?, servicios=?
       WHERE id=? AND activo=TRUE`,
      [
        nombre, municipio_id, tipo, descripcion || null, imagen_url || null,
        precio_noche || null, capacidad || null, estrellas || null,
        direccion || null, telefono || null,
        servicios ? JSON.stringify(servicios) : null,
        req.params.id,
      ]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Alojamiento no encontrado' });
    res.json({
      id: Number(req.params.id), nombre, municipio_id, tipo, descripcion, imagen_url,
      precio_noche, capacidad, estrellas, direccion, telefono, servicios,
    });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Ese municipio_id no existe' });
    }
    res.status(500).json({ error: err.message });
  }
});

// "Eliminar" un alojamiento: no lo borra, lo marca como inactivo (soft delete).
app.delete('/api/alojamientos/:id', async (req, res) => {
  try {
    const [result] = await pool.query('UPDATE alojamientos SET activo = FALSE WHERE id = ? AND activo = TRUE', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Alojamiento no encontrado' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Solo escucha si se ejecuta directamente (`npm start`), no al importarlo desde una prueba.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`alojamiento-service escuchando en el puerto ${PORT}`);
  });
}

module.exports = app;
