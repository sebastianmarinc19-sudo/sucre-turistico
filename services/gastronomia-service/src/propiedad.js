const crypto = require('crypto');

// Permisos por dueno de cada ficha (docs/sql/06-roles-negocios.sql).
//
//   superadmin  toca todas las fichas y puede asignarles dueno.
//   negocio     solo ve en su panel y modifica las fichas cuyo propietario_id
//               es su cuenta; lo que crea queda a su nombre.
//   turista     (sin sesion) solo ve las fichas publicadas de cuentas activas.
//
// Quien hace la peticion lo dice el API Gateway con X-Usuario-Id y
// X-Usuario-Rol. Solo se les cree si ademas viene X-Gateway-Secret: llamando
// directo al servicio cualquiera podria inventarselas.
// Esta copia es igual en los cuatro servicios con dueno; si la cambian,
// cambienla en todos.

function iguales(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function usuarioDe(req) {
  const secreto = process.env.GATEWAY_SECRET;
  if (!secreto || !iguales(req.get('x-gateway-secret') || '', secreto)) return null;
  const id = Number(req.get('x-usuario-id'));
  const rol = req.get('x-usuario-rol');
  if (!id || !['superadmin', 'negocio'].includes(rol)) return null;
  return { id, rol };
}

// Condicion SQL para listar/leer segun quien pregunta. `a` es el alias de la
// tabla. Con ?panel=1 (lo manda el panel de administracion) el superadmin ve
// todo y el negocio solo lo suyo, publicado o no; sin eso, aunque haya sesion,
// se ve lo mismo que el turista: el sitio publico no cambia por estar logueado.
function filtroVisibilidad(req, a) {
  const usuario = usuarioDe(req);
  if (req.query.panel === '1' && usuario) {
    if (usuario.rol === 'superadmin') return { sql: '', params: [] };
    return { sql: ` AND ${a}.propietario_id = ?`, params: [usuario.id] };
  }
  return {
    sql: ` AND ${a}.publicado = TRUE AND (${a}.propietario_id IS NULL
            OR EXISTS (SELECT 1 FROM usuarios u WHERE u.id = ${a}.propietario_id AND u.activo = TRUE))`,
    params: [],
  };
}

// 'ok' | 'no-existe' | 'ajena'. Una ficha borrada (activo = FALSE) no existe.
async function permisoSobre(pool, tabla, id, usuario) {
  const [rows] = await pool.query(`SELECT propietario_id FROM ${tabla} WHERE id = ? AND activo = TRUE`, [id]);
  if (rows.length === 0) return 'no-existe';
  if (usuario?.rol === 'superadmin') return 'ok';
  if (usuario && rows[0].propietario_id === usuario.id) return 'ok';
  return 'ajena';
}

// Lo que crea un negocio es suyo, diga lo que diga el formulario; el
// superadmin puede asignarle dueno o dejarla sin dueno (null).
function propietarioAlCrear(usuario, body) {
  if (usuario?.rol === 'negocio') return usuario.id;
  return body.propietario_id ? Number(body.propietario_id) : null;
}

// Responde 404 o 403 si no se puede tocar la ficha; devuelve true si se puede.
async function exigirPermiso(pool, tabla, req, res, nombre) {
  const permiso = await permisoSobre(pool, tabla, req.params.id, usuarioDe(req));
  if (permiso === 'no-existe') { res.status(404).json({ error: `${nombre} no encontrado` }); return false; }
  if (permiso === 'ajena') { res.status(403).json({ error: `Este ${nombre.toLowerCase()} es de otro negocio` }); return false; }
  return true;
}

// PATCH <ruta>/:id/publicado { publicado } — el dueno (o el superadmin)
// muestra u oculta su ficha en el sitio sin borrarla.
function rutaPublicar(app, pool, { tabla, ruta, nombre }) {
  app.patch(`${ruta}/:id/publicado`, async (req, res) => {
    try {
      if (typeof req.body?.publicado !== 'boolean') return res.status(400).json({ error: 'publicado debe ser true o false' });
      if (!(await exigirPermiso(pool, tabla, req, res, nombre))) return undefined;
      await pool.query(`UPDATE ${tabla} SET publicado = ? WHERE id = ?`, [req.body.publicado, req.params.id]);
      return res.json({ id: Number(req.params.id), publicado: req.body.publicado });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });
}

module.exports = { usuarioDe, filtroVisibilidad, permisoSobre, propietarioAlCrear, exigirPermiso, rutaPublicar };
