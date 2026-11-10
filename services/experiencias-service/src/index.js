const express = require('express');
const cors = require('cors');
const soloGateway = require('./solo-gateway');
const { usuarioDe, filtroVisibilidad, propietarioAlCrear, exigirPermiso, rutaPublicar } = require('./propiedad');
const { montarReservas } = require('./reservas');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(soloGateway);

const PORT = process.env.PORT || 4004;

const TIPOS = ['acuatica', 'cultural', 'ecoturismo', 'aventura', 'gastronomica'];

app.get('/health', (req, res) => {
  res.json({ service: 'experiencias-service', status: 'ok' });
});

const SELECT_BASE = `
  SELECT x.id, x.nombre, m.nombre AS municipio, x.municipio_id,
         x.tipo, x.descripcion, x.imagen_url, x.precio, x.duracion_horas, x.operador,
         x.propietario_id, x.publicado
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
    const vis = filtroVisibilidad(req, 'x');
    let sql = `${SELECT_BASE} WHERE x.activo = TRUE${vis.sql}`;
    const params = [...vis.params];

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

// Reservaciones (src/reservas.js). Va antes de /api/experiencias/:id: si no, "reservas" se tomaria como un id.
montarReservas(app, pool, { seccion: 'experiencia', tabla: 'experiencias', ruta: '/api/experiencias' });

app.get('/api/experiencias/:id', async (req, res) => {
  try {
    const vis = filtroVisibilidad(req, 'x');
    const [rows] = await pool.query(`${SELECT_BASE} WHERE x.id = ? AND x.activo = TRUE${vis.sql}`, [req.params.id, ...vis.params]);
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
    const propietario_id = propietarioAlCrear(usuarioDe(req), req.body);
    const [result] = await pool.query(
      `INSERT INTO experiencias (nombre, municipio_id, tipo, descripcion, imagen_url, precio, duracion_horas, operador, propietario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, municipio_id, tipo, descripcion || null, imagen_url || null, precio ?? null, duracion_horas ?? null, operador || null, propietario_id]
    );
    res.status(201).json({ id: result.insertId, nombre, municipio_id, tipo, descripcion, imagen_url, precio, duracion_horas, operador, propietario_id });
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

    if (!(await exigirPermiso(pool, 'experiencias', req, res, 'Experiencia'))) return undefined;
    const { nombre, municipio_id, tipo, descripcion, imagen_url, precio, duracion_horas, operador } = req.body;
    // Solo el superadmin cambia el dueno; un negocio no puede regalar ni robar fichas.
    const cambiaDueno = usuarioDe(req)?.rol === 'superadmin' && 'propietario_id' in req.body;
    const [result] = await pool.query(
      `UPDATE experiencias SET nombre=?, municipio_id=?, tipo=?, descripcion=?, imagen_url=?,
         precio=?, duracion_horas=?, operador=?${cambiaDueno ? ', propietario_id=?' : ''}
       WHERE id=? AND activo=TRUE`,
      [
        nombre, municipio_id, tipo, descripcion || null, imagen_url || null, precio ?? null, duracion_horas ?? null, operador || null,
        ...(cambiaDueno ? [req.body.propietario_id ? Number(req.body.propietario_id) : null] : []),
        req.params.id,
      ]
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
    if (!(await exigirPermiso(pool, 'experiencias', req, res, 'Experiencia'))) return undefined;
    const [result] = await pool.query('UPDATE experiencias SET activo = FALSE WHERE id = ? AND activo = TRUE', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Experiencia no encontrada' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

rutaPublicar(app, pool, { tabla: 'experiencias', ruta: '/api/experiencias', nombre: 'Experiencia' });

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`experiencias-service escuchando en el puerto ${PORT}`);
  });
}

module.exports = app;
