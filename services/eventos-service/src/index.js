const express = require('express');
const cors = require('cors');
const soloGateway = require('./solo-gateway');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(soloGateway);

const PORT = process.env.PORT || 4005;

const TIPOS = ['festival', 'feria', 'religioso', 'cultural', 'deportivo'];
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

app.get('/health', (req, res) => {
  res.json({ service: 'eventos-service', status: 'ok' });
});

const SELECT_BASE = `
  SELECT e.id, e.nombre, m.nombre AS municipio, e.municipio_id,
         e.tipo, e.descripcion, e.imagen_url, e.fecha_inicio, e.fecha_fin,
         e.lugar, e.precio_entrada
  FROM eventos e
  JOIN municipios m ON m.id = e.municipio_id
`;

// Devuelve un mensaje de error, o null si los datos sirven para guardar.
function validar({ nombre, municipio_id, tipo, fecha_inicio, fecha_fin }) {
  if (!nombre || !municipio_id || !tipo || !fecha_inicio) {
    return 'nombre, municipio_id, tipo y fecha_inicio son obligatorios';
  }
  if (!TIPOS.includes(tipo)) return `tipo debe ser uno de: ${TIPOS.join(', ')}`;
  if (!FECHA.test(fecha_inicio)) return 'fecha_inicio debe tener el formato AAAA-MM-DD';
  if (fecha_fin && !FECHA.test(fecha_fin)) return 'fecha_fin debe tener el formato AAAA-MM-DD';
  // Comparar como texto funciona porque el formato AAAA-MM-DD ordena igual que la fecha.
  if (fecha_fin && fecha_fin < fecha_inicio) return 'fecha_fin no puede ser anterior a fecha_inicio';
  return null;
}

// Listar eventos (filtros opcionales: municipio, tipo y rango de fechas).
// ?desde y ?hasta traen los eventos que caen, aunque sea en parte, dentro del rango.
app.get('/api/eventos', async (req, res) => {
  try {
    const { municipio, tipo, desde, hasta } = req.query;
    if ((desde && !FECHA.test(desde)) || (hasta && !FECHA.test(hasta))) {
      return res.status(400).json({ error: 'desde y hasta deben tener el formato AAAA-MM-DD' });
    }

    let sql = `${SELECT_BASE} WHERE e.activo = TRUE`;
    const params = [];

    if (municipio) {
      sql += ' AND m.nombre = ?';
      params.push(municipio);
    }
    if (tipo) {
      sql += ' AND e.tipo = ?';
      params.push(tipo);
    }
    if (desde) {
      sql += ' AND COALESCE(e.fecha_fin, e.fecha_inicio) >= ?';
      params.push(desde);
    }
    if (hasta) {
      sql += ' AND e.fecha_inicio <= ?';
      params.push(hasta);
    }
    // Una agenda se lee en orden cronologico: el proximo evento primero.
    sql += ' ORDER BY e.fecha_inicio ASC, e.id ASC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Va ANTES de /:id para que "catalogos" no se interprete como un id.
app.get('/api/eventos/catalogos/municipios', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre FROM municipios ORDER BY nombre');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/eventos/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`${SELECT_BASE} WHERE e.id = ? AND e.activo = TRUE`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/eventos', async (req, res) => {
  try {
    const error = validar(req.body);
    if (error) return res.status(400).json({ error });

    const { nombre, municipio_id, tipo, descripcion, imagen_url, fecha_inicio, fecha_fin, lugar, precio_entrada } = req.body;
    const [result] = await pool.query(
      `INSERT INTO eventos (nombre, municipio_id, tipo, descripcion, imagen_url, fecha_inicio, fecha_fin, lugar, precio_entrada)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, municipio_id, tipo, descripcion || null, imagen_url || null, fecha_inicio, fecha_fin || null, lugar || null, precio_entrada ?? null]
    );
    res.status(201).json({ id: result.insertId, nombre, municipio_id, tipo, descripcion, imagen_url, fecha_inicio, fecha_fin, lugar, precio_entrada });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Ese municipio_id no existe' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/eventos/:id', async (req, res) => {
  try {
    const error = validar(req.body);
    if (error) return res.status(400).json({ error });

    const { nombre, municipio_id, tipo, descripcion, imagen_url, fecha_inicio, fecha_fin, lugar, precio_entrada } = req.body;
    const [result] = await pool.query(
      `UPDATE eventos SET nombre=?, municipio_id=?, tipo=?, descripcion=?, imagen_url=?,
         fecha_inicio=?, fecha_fin=?, lugar=?, precio_entrada=?
       WHERE id=? AND activo=TRUE`,
      [nombre, municipio_id, tipo, descripcion || null, imagen_url || null, fecha_inicio, fecha_fin || null, lugar || null, precio_entrada ?? null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json({ id: Number(req.params.id), nombre, municipio_id, tipo, descripcion, imagen_url, fecha_inicio, fecha_fin, lugar, precio_entrada });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Ese municipio_id no existe' });
    }
    res.status(500).json({ error: err.message });
  }
});

// "Eliminar" no borra la fila: la marca como inactiva (soft delete).
app.delete('/api/eventos/:id', async (req, res) => {
  try {
    const [result] = await pool.query('UPDATE eventos SET activo = FALSE WHERE id = ? AND activo = TRUE', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Evento no encontrado' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`eventos-service escuchando en el puerto ${PORT}`);
  });
}

module.exports = app;
