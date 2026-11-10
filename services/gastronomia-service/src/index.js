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
         r.direccion, r.telefono, r.propietario_id, r.publicado
  FROM restaurantes r
  JOIN municipios m ON m.id = r.municipio_id
`;

// Listar restaurantes (con filtro opcional por municipio, tipo de cocina o rango de precio)
app.get('/api/gastronomia', async (req, res) => {
  try {
    const { municipio, tipo_cocina, rango_precio } = req.query;
    // activo = TRUE deja fuera los que se "borraron".
    const vis = filtroVisibilidad(req, 'r');
    let sql = `${SELECT_BASE} WHERE r.activo = TRUE${vis.sql}`;
    const params = [...vis.params];

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

// Obtener un restaurante por id, con su carta de platos (historia 7: "consultar
// restaurantes y platos tipicos"). Es la relacion 1-a-muchos del esquema; la
// Reservaciones (src/reservas.js). Va antes de /api/gastronomia/:id: si no, "reservas" se tomaria como un id.
montarReservas(app, pool, { seccion: 'restaurante', tabla: 'restaurantes', ruta: '/api/gastronomia' });

// lista general no los trae para no pesar.
app.get('/api/gastronomia/:id', async (req, res) => {
  try {
    const vis = filtroVisibilidad(req, 'r');
    const [rows] = await pool.query(`${SELECT_BASE} WHERE r.id = ? AND r.activo = TRUE${vis.sql}`, [req.params.id, ...vis.params]);
    if (rows.length === 0) return res.status(404).json({ error: 'Restaurante no encontrado' });
    const [platos] = await pool.query(
      `SELECT id, nombre, descripcion, precio, es_tipico
       FROM platos WHERE restaurante_id = ?
       ORDER BY es_tipico DESC, nombre`,
      [req.params.id]
    );
    res.json({ ...rows[0], platos });
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
    const propietario_id = propietarioAlCrear(usuarioDe(req), req.body);
    const [result] = await pool.query(
      `INSERT INTO restaurantes (nombre, municipio_id, tipo_cocina, descripcion, imagen_url, rango_precio, direccion, telefono, propietario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, municipio_id, tipo_cocina, descripcion || null, imagen_url || null, rango_precio || null, direccion || null, telefono || null, propietario_id]
    );
    res.status(201).json({ id: result.insertId, nombre, municipio_id, tipo_cocina, descripcion, imagen_url, rango_precio, direccion, telefono, propietario_id });
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
    if (!(await exigirPermiso(pool, 'restaurantes', req, res, 'Restaurante'))) return undefined;
    // Solo el superadmin cambia el dueno; un negocio no puede regalar ni robar fichas.
    const cambiaDueno = usuarioDe(req)?.rol === 'superadmin' && 'propietario_id' in req.body;
    const [result] = await pool.query(
      `UPDATE restaurantes
       SET nombre=?, municipio_id=?, tipo_cocina=?, descripcion=?, imagen_url=?, rango_precio=?, direccion=?, telefono=?${cambiaDueno ? ', propietario_id=?' : ''}
       WHERE id=? AND activo=TRUE`,
      [
        nombre, municipio_id, tipo_cocina, descripcion || null, imagen_url || null, rango_precio || null, direccion || null, telefono || null,
        ...(cambiaDueno ? [req.body.propietario_id ? Number(req.body.propietario_id) : null] : []),
        req.params.id,
      ]
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
    if (!(await exigirPermiso(pool, 'restaurantes', req, res, 'Restaurante'))) return undefined;
    const [result] = await pool.query('UPDATE restaurantes SET activo = FALSE WHERE id = ? AND activo = TRUE', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Restaurante no encontrado' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

rutaPublicar(app, pool, { tabla: 'restaurantes', ruta: '/api/gastronomia', nombre: 'Restaurante' });

// --- Carta de platos: la maneja el dueno del restaurante (o el superadmin) ---

function validarPlato({ nombre, precio }) {
  if (!nombre) return 'nombre es obligatorio';
  if (precio != null && precio !== '' && !(Number(precio) >= 0)) return 'precio debe ser un numero mayor o igual a 0';
  return null;
}

// POST /api/gastronomia/:id/platos
app.post('/api/gastronomia/:id/platos', async (req, res) => {
  try {
    const error = validarPlato(req.body || {});
    if (error) return res.status(400).json({ error });
    if (!(await exigirPermiso(pool, 'restaurantes', req, res, 'Restaurante'))) return undefined;
    const { nombre, descripcion, precio, es_tipico } = req.body;
    const [result] = await pool.query(
      'INSERT INTO platos (restaurante_id, nombre, descripcion, precio, es_tipico) VALUES (?, ?, ?, ?, ?)',
      [req.params.id, nombre, descripcion || null, precio ?? null, es_tipico !== false]
    );
    return res.status(201).json({ id: result.insertId, restaurante_id: Number(req.params.id), nombre, descripcion, precio, es_tipico: es_tipico !== false });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /api/gastronomia/:id/platos/:platoId
app.put('/api/gastronomia/:id/platos/:platoId', async (req, res) => {
  try {
    const error = validarPlato(req.body || {});
    if (error) return res.status(400).json({ error });
    if (!(await exigirPermiso(pool, 'restaurantes', req, res, 'Restaurante'))) return undefined;
    const { nombre, descripcion, precio, es_tipico } = req.body;
    // restaurante_id en el WHERE: no se puede editar un plato de otro restaurante cambiando el id de la URL.
    const [result] = await pool.query(
      'UPDATE platos SET nombre=?, descripcion=?, precio=?, es_tipico=? WHERE id=? AND restaurante_id=?',
      [nombre, descripcion || null, precio ?? null, es_tipico !== false, req.params.platoId, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Plato no encontrado en este restaurante' });
    return res.json({ id: Number(req.params.platoId), nombre, descripcion, precio, es_tipico: es_tipico !== false });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/gastronomia/:id/platos/:platoId — un plato si se borra de verdad:
// no tiene historial que cuidar y la carta cambia seguido.
app.delete('/api/gastronomia/:id/platos/:platoId', async (req, res) => {
  try {
    if (!(await exigirPermiso(pool, 'restaurantes', req, res, 'Restaurante'))) return undefined;
    const [result] = await pool.query('DELETE FROM platos WHERE id=? AND restaurante_id=?', [req.params.platoId, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Plato no encontrado en este restaurante' });
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Solo escucha si se ejecuta directamente (`npm start`), no al importarlo desde una prueba.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`gastronomia-service escuchando en el puerto ${PORT}`);
  });
}

module.exports = app;
