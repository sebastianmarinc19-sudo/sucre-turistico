# Guía paso a paso: implementar un CRUD real

Esta guía es para quien vaya a programar `destinos-service` o `alojamiento-service` (o cualquiera de los otros). Está pensada para seguirla y entenderla, no para copiar y pegar sin leer — vas a tener que explicar este código, así que vale la pena entender cada parte.

Usamos **`destinos-service`** como ejemplo completo (tarea de Halit). Al final explicamos cómo adaptarlo para **`alojamiento-service`** (tarea de Jaime) — el patrón es idéntico, solo cambian los nombres.

## Antes de empezar

```bash
git clone https://github.com/sebastianmarinc19-sudo/sucre-turistico.git
cd sucre-turistico
git checkout develop
git pull

npm install
npm run setup          # crea los .env de cada servicio

git checkout -b feature/destinos-crud-municipios
```

Levanta el entorno local (necesitas Docker Desktop instalado y abierto):

```bash
npm run up
```

Esto levanta MySQL local en `localhost:3306` y todos los servicios. **Vamos a trabajar contra este MySQL local, no contra la base de datos en la nube** — así nadie pisa el trabajo de nadie ni gastamos la cuota gratis compartida.

> **Si tu equipo tiene 6 GB de RAM o menos, `npm run up` se va a caer.** El stack completo pide ~4.3 GB. No es que hayas hecho algo mal. Usa la ruta ligera de [`DESARROLLO_LOCAL.md`](DESARROLLO_LOCAL.md): levantas MySQL solo con `docker compose up -d mysql` (~400 MB) y tu servicio con `npm start` desde su carpeta. El resto de la guía funciona igual.

## Paso 1 — El driver de MySQL ya está instalado

`mysql2` (la librería que permite a Node.js hablar con MySQL) ya viene como dependencia de los cinco servicios que usan base de datos. Con el `npm install` de arriba ya lo tienes.

> **No corras `npm install mysql2`.** Como usamos npm workspaces, ese comando modifica el `package-lock.json` de la **raíz**. Si los tres lo hacemos en ramas distintas, son tres conflictos en el mismo archivo. Ya está instalado justamente para evitar eso.

## Paso 2 — Las tablas ya están definidas

El esquema está escrito y es **compartido por los tres**. No inventes tus propias columnas: las cinco entidades siguen la misma forma a propósito, porque el buscador (criterio 2) mete todas en un mismo índice y los facets (criterio 3) agrupan por los mismos campos.

Vive en `docs/sql/`, y MySQL lo ejecuta en orden por el número del nombre:

| Archivo | Qué crea |
|---|---|
| `01-usuarios.sql` | tabla de administradores |
| `02-municipios.sql` | los 26 municipios de Sucre — catálogo compartido |
| `03-catalogo.sql` | `destinos`, `alojamientos`, `restaurantes`, `platos`, `experiencias`, `eventos` |
| `04-datos-ejemplo.sql` | filas de ejemplo, para que la app muestre algo desde el primer día |

**Antes de programar, lee el comentario del encabezado de [`03-catalogo.sql`](sql/03-catalogo.sql).** Ahí están las convenciones que compartimos y el porqué de cada una.

### En local no tienes que hacer nada

docker-compose monta `docs/sql` en `/docker-entrypoint-initdb.d`, y MySQL corre esos archivos solo la **primera vez** que se crea el volumen. Si ya habías levantado la base antes de este cambio, las tablas no existen todavía:

```bash
docker compose down -v && npm run up
```

Si estás en la ruta ligera de [`DESARROLLO_LOCAL.md`](DESARROLLO_LOCAL.md):

```bash
docker compose down -v && docker compose up -d mysql
```

`-v` borra tus datos locales. Son de prueba, no pasa nada.

### Así quedó tu tabla

```sql
CREATE TABLE destinos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  municipio_id INT NOT NULL,          -- -> municipios(id)
  categoria ENUM('playa', 'atractivo_natural', 'atractivo_cultural', 'lugar_turistico') NOT NULL,
  descripcion TEXT,
  imagen_url VARCHAR(500),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ...
);
```

Dos cosas que cambian cómo escribes el CRUD:

**`municipio_id`, no `municipio`.** El municipio es una llave foránea, no un texto libre. Si cada uno guardara el nombre a mano, "Tolú" y "Tolu" contarían como dos municipios distintos y el facet de municipio quedaría roto. Hacia afuera tu API **sí** devuelve el nombre, con un `JOIN` y un alias — el front no se entera de la diferencia.

**`activo`, en vez de borrar de verdad.** El `DELETE` de tu CRUD hace `UPDATE ... SET activo = FALSE`. Si en plena demo alguien borra algo por error, se recupera con un UPDATE. Los `GET` públicos filtran por `WHERE activo = TRUE`.

### Para mirar la base con un cliente visual

Opciones fáciles y gratis: [TablePlus](https://tableplus.com/), [DBeaver](https://dbeaver.io/), o la extensión "SQLTools" de VS Code. Conéctate a tu MySQL local:

```
Host: localhost     Puerto: 3306
Usuario: root       Contraseña: root
Base de datos: sucre_turistico
```

## Paso 3 — Conectar el servicio a la base de datos

Crea el archivo `services/destinos-service/src/db.js`:

```js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? {} : undefined,
});

module.exports = pool;
```

Esto crea un **pool de conexiones**: en vez de abrir y cerrar una conexión a MySQL en cada petición (lento), mantiene varias conexiones listas para reutilizar.

## Paso 4 — Implementar las rutas CRUD

Abre `services/destinos-service/src/index.js`. Busca la línea:

```js
// TODO: rutas de destinos-service
```

Y reemplázala por esto:

```js
const pool = require('./db');

// Todas las consultas hacen JOIN con municipios y renombran m.nombre a
// "municipio". Asi la API sigue devolviendo { municipio: "Coveñas" } aunque
// en la tabla lo que se guarde sea un municipio_id: el front no cambia.
const SELECT_BASE = `
  SELECT d.id, d.nombre, m.nombre AS municipio, d.municipio_id,
         d.categoria, d.descripcion, d.imagen_url
  FROM destinos d
  JOIN municipios m ON m.id = d.municipio_id
`;

// Listar destinos (con filtro opcional por municipio o categoría)
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
    const [result] = await pool.query(
      'UPDATE destinos SET nombre=?, municipio_id=?, categoria=?, descripcion=?, imagen_url=? WHERE id=? AND activo=TRUE',
      [nombre, municipio_id, categoria, descripcion, imagen_url, req.params.id]
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

// "Eliminar" un destino: no lo borra, lo marca como inactivo.
app.delete('/api/destinos/:id', async (req, res) => {
  try {
    const [result] = await pool.query('UPDATE destinos SET activo = FALSE WHERE id = ? AND activo = TRUE', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Destino no encontrado' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lista de municipios, para llenar el <select> del formulario del front.
app.get('/api/destinos/catalogos/municipios', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre FROM municipios ORDER BY nombre');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

**Qué está pasando en cada ruta** (esto te lo van a preguntar en la sustentación):
- `?` en el SQL es un **placeholder** — evita que alguien inyecte SQL malicioso metiendo código en el campo `nombre` (esto se llama SQL injection).
- `try/catch` captura errores (ej. si la base de datos no responde) y responde con un mensaje en vez de que el servidor se caiga.
- Los códigos de estado HTTP importan: `201` = creado, `404` = no existe, `400` = el usuario mandó datos inválidos, `500` = error del servidor.
- El **`JOIN`** con `municipios` es lo que permite guardar un `municipio_id` pero devolver el nombre. El alias `AS municipio` es lo que hace que el front siga funcionando igual.
- El `DELETE` hace un **`UPDATE`**. Se llama *soft delete*: el dato queda en la base marcado como inactivo. Es lo que hace la mayoría de aplicaciones reales, porque borrar de verdad no se deshace.

## Paso 5 — Probar que funciona

Con `npm run up` corriendo, prueba desde otra terminal:

```bash
# Listar (ya trae los 6 destinos de 04-datos-ejemplo.sql)
curl http://localhost:4001/api/destinos

# Filtrar
curl "http://localhost:4001/api/destinos?municipio=Cove%C3%B1as"
curl "http://localhost:4001/api/destinos?categoria=playa"

# Ver los municipios y sus id (los necesitas para crear)
curl http://localhost:4001/api/destinos/catalogos/municipios

# Crear  (municipio_id, no municipio: saca el numero del comando de arriba)
curl -X POST http://localhost:4001/api/destinos   -H "Content-Type: application/json"   -d '{"nombre":"Volcán del Totumo","municipio_id":1,"categoria":"atractivo_natural","descripcion":"Ejemplo de prueba."}'

# Obtener uno (cambia el 1 por el id real)
curl http://localhost:4001/api/destinos/1

# Actualizar
curl -X PUT http://localhost:4001/api/destinos/1   -H "Content-Type: application/json"   -d '{"nombre":"Playa de Coveñas","municipio_id":7,"categoria":"playa","descripcion":"Actualizado"}'

# Eliminar (lo marca inactivo; deja de salir en el listado)
curl -X DELETE http://localhost:4001/api/destinos/1
```

También puedes probar a través del Gateway (`http://localhost:4000/api/destinos`) para confirmar que el proxy funciona.

> **Ojo con las escrituras a través del Gateway.** Los `GET` son públicos, pero `POST`, `PUT` y `DELETE` en el puerto 4000 exigen un token de administrador y responden `401` sin él. Mientras desarrollas, lo más cómodo es probar **directo contra tu servicio en el puerto 4001**, que no pide token. Si necesitas probar la cadena completa, saca un token siguiendo [`AUTENTICACION.md`](AUTENTICACION.md) y mándalo en el header `Authorization: Bearer <token>`.

Si prefieres una interfaz visual en vez de `curl`, usa [Postman](https://www.postman.com/) o la extensión "Thunder Client" de VS Code.

## Paso 6 — Agregar una prueba automática

Las pruebas manuales con `curl` sirven para ti hoy; una prueba automática sirve para todo el equipo siempre, y el CI la corre sola en cada Pull Request. Con dos pruebas ya tienes algo real que mostrar en la sustentación.

Primero, al final de `services/destinos-service/src/index.js`, cambia el `app.listen(...)` para que el archivo se pueda importar sin arrancar el servidor:

```js
// Solo escucha si se ejecuta directamente (`npm start`), no al importarlo desde una prueba.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`destinos-service escuchando en el puerto ${PORT}`);
  });
}

module.exports = app;
```

Agrega el script de pruebas en `services/destinos-service/package.json`:

```json
"scripts": {
  "start": "node src/index.js",
  "dev": "nodemon src/index.js",
  "test": "node --test"
}
```

Y crea `services/destinos-service/test/destinos.test.js`:

```js
const { test } = require('node:test');
const assert = require('node:assert');
const app = require('../src/index');

// Levanta el servicio en un puerto libre (el 0 se lo pide al sistema operativo).
function escuchar() {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
  });
}

test('GET /health responde ok', async () => {
  const server = await escuchar();
  const res = await fetch(`http://127.0.0.1:${server.address().port}/health`);
  const body = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.status, 'ok');
  server.close();
});

test('POST sin los campos obligatorios responde 400', async () => {
  const server = await escuchar();
  const res = await fetch(`http://127.0.0.1:${server.address().port}/api/destinos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: 'Le falta municipio y categoria' }),
  });

  assert.strictEqual(res.status, 400);
  server.close();
});
```

Córrelas con:

```bash
npm test --workspace=services/destinos-service
```

**Por qué estas dos y no un CRUD completo:** ninguna de las dos necesita base de datos. La validación del `POST` ocurre *antes* de llegar a MySQL, así que la prueba pasa sin conexión — y por eso el CI puede ejecutarla sin levantar una base de datos. Probar el `INSERT` real requiere una base de datos de pruebas; eso es un paso más avanzado que pueden dejar para después si sobra tiempo.

Mira `api-gateway/test/gateway.test.js` como ejemplo ya funcionando en el repo.

## Paso 7 — Subir tu trabajo

```bash
git add .
git commit -m "feat: implementar CRUD de destinos-service"
git push origin feature/destinos-crud-municipios
```

Abre un Pull Request en GitHub contra `develop`, pide que alguien del equipo lo revise (ver `CONTRIBUTING.md`), y mergea cuando esté aprobado.

---

## Cómo se adapta a los otros servicios

El patrón es idéntico en los cinco. Lo único que cambia son los nombres y la columna de clasificación:

| Servicio | Puerto | Tabla | Ruta base | Clasificación | Responsable |
|---|---|---|---|---|---|
| `destinos-service` | 4001 | `destinos` | `/api/destinos` | `categoria` | Halit |
| `alojamiento-service` | 4002 | `alojamientos` | `/api/alojamientos` | `tipo` | Jaime |
| `gastronomia-service` | 4003 | `restaurantes` | `/api/gastronomia` | `tipo_cocina` | Halit |
| `experiencias-service` | 4004 | `experiencias` | `/api/experiencias` | `tipo` | Jaime |
| `eventos-service` | 4005 | `eventos` | `/api/eventos` | `tipo` | Sebastián |

Los pasos, en concreto:

1. **No instales nada**: `mysql2` ya está en tu `package.json` (Paso 1).
2. **No crees la tabla**: ya existe en [`03-catalogo.sql`](sql/03-catalogo.sql). Mira ahí qué columnas tiene la tuya — todas comparten `id`, `nombre`, `municipio_id`, `descripcion`, `imagen_url` y `activo`, y cada una agrega las suyas.
3. Copia `src/db.js` tal cual.
4. Copia las rutas del Paso 4 cambiando la tabla, la ruta y los campos del `INSERT`/`UPDATE`. El `JOIN` con `municipios`, el `WHERE activo = TRUE` y el soft delete son iguales en todos.
5. Prueba en tu puerto.
6. Misma prueba automática del Paso 6, en `services/<tu-servicio>/test/`.

**Ojo con los dos que tienen algo propio:**

- **`gastronomia-service`** tiene además la tabla `platos`, que cuelga de `restaurantes`. El CRUD de platos es opcional si el tiempo aprieta — primero terminen restaurantes.
- **`eventos-service`** tiene `fecha_inicio` obligatoria. La historia 11 del backlog pide consultar por fecha, así que el listado debe aceptar `?desde=2026-01-01&hasta=2026-12-31`.

## Cuando ya esté listo para producción

Las tablas también tienen que existir en la base de datos de la nube (TiDB) para que funcione en Render. Ahí los archivos de `docs/sql/` **no se ejecutan solos**: hay que correrlos a mano una vez, en orden (`01`, `02`, `03`, y `04` solo si queremos los datos de ejemplo también en producción).

Eso lo coordina Sebastián — avísale cuando tu PR esté aprobado.
