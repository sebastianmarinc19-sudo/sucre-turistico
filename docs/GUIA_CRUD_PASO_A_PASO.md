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

## Paso 1 — Instalar el driver de MySQL

Dentro de `services/destinos-service/`:

```bash
npm install mysql2
```

Esto agrega `mysql2` a su `package.json`. Es la librería que permite a Node.js hablar con MySQL.

## Paso 2 — Crear la tabla en la base de datos

Necesitas un cliente de MySQL para ejecutar SQL. Opciones fáciles y gratis:
- [TablePlus](https://tableplus.com/) (recomendado, interfaz simple)
- [DBeaver](https://dbeaver.io/) (gratis, más completo)
- La extensión "SQLTools" en VS Code

Conéctate con estos datos (son los de tu MySQL local, del `docker-compose.yml`):

```
Host: localhost
Puerto: 3306
Usuario: root
Contraseña: root
Base de datos: sucre_turistico
```

Ejecuta esto para crear la tabla:

```sql
CREATE TABLE destinos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  municipio VARCHAR(100) NOT NULL,
  categoria ENUM('playa', 'atractivo_natural', 'atractivo_cultural', 'lugar_turistico') NOT NULL,
  descripcion TEXT,
  imagen_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**¿Por qué una sola tabla `destinos` con una columna `categoria`, en vez de tablas separadas para municipios/playas/atractivos?** Porque para un CRUD básico es más simple de manejar y de explicar, y cumple igual con lo que pide el objetivo del proyecto. Si más adelante necesitan algo más sofisticado, se puede normalizar.

Prueba insertando un par de filas de ejemplo:

```sql
INSERT INTO destinos (nombre, municipio, categoria, descripcion) VALUES
('Playa Coveñas', 'Coveñas', 'playa', 'Playa principal del municipio, ideal para deportes acuáticos.'),
('Mangle de San Bernardo', 'Tolú', 'atractivo_natural', 'Ecosistema de manglar con recorridos guiados.');
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

// Listar todos los destinos (con filtro opcional por municipio o categoría)
app.get('/api/destinos', async (req, res) => {
  try {
    const { municipio, categoria } = req.query;
    let sql = 'SELECT * FROM destinos WHERE 1=1';
    const params = [];

    if (municipio) {
      sql += ' AND municipio = ?';
      params.push(municipio);
    }
    if (categoria) {
      sql += ' AND categoria = ?';
      params.push(categoria);
    }
    sql += ' ORDER BY id DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener un destino por id
app.get('/api/destinos/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM destinos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Destino no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear un destino nuevo
app.post('/api/destinos', async (req, res) => {
  try {
    const { nombre, municipio, categoria, descripcion, imagen_url } = req.body;
    if (!nombre || !municipio || !categoria) {
      return res.status(400).json({ error: 'nombre, municipio y categoria son obligatorios' });
    }
    const [result] = await pool.query(
      'INSERT INTO destinos (nombre, municipio, categoria, descripcion, imagen_url) VALUES (?, ?, ?, ?, ?)',
      [nombre, municipio, categoria, descripcion || null, imagen_url || null]
    );
    res.status(201).json({ id: result.insertId, nombre, municipio, categoria, descripcion, imagen_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar un destino
app.put('/api/destinos/:id', async (req, res) => {
  try {
    const { nombre, municipio, categoria, descripcion, imagen_url } = req.body;
    const [result] = await pool.query(
      'UPDATE destinos SET nombre=?, municipio=?, categoria=?, descripcion=?, imagen_url=? WHERE id=?',
      [nombre, municipio, categoria, descripcion, imagen_url, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Destino no encontrado' });
    res.json({ id: req.params.id, nombre, municipio, categoria, descripcion, imagen_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar un destino
app.delete('/api/destinos/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM destinos WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Destino no encontrado' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

**Qué está pasando en cada ruta** (esto te lo van a preguntar en la sustentación):
- `?` en el SQL es un **placeholder** — evita que alguien inyecte SQL malicioso metiendo código en el campo `nombre` (esto se llama SQL injection).
- `try/catch` captura errores (ej. si la base de datos no responde) y responde con un mensaje en vez de que el servidor se caiga.
- Los códigos de estado HTTP importan: `201` = creado, `404` = no existe, `400` = el usuario mandó datos inválidos, `500` = error del servidor.

## Paso 5 — Probar que funciona

Con `npm run up` corriendo, prueba desde otra terminal:

```bash
# Listar
curl http://localhost:4001/api/destinos

# Crear
curl -X POST http://localhost:4001/api/destinos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Islas de San Bernardo","municipio":"Tolú","categoria":"atractivo_natural","descripcion":"Archipiélago con arrecifes de coral."}'

# Obtener uno (cambia el 1 por el id real)
curl http://localhost:4001/api/destinos/1

# Actualizar
curl -X PUT http://localhost:4001/api/destinos/1 \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Islas de San Bernardo","municipio":"Tolú","categoria":"atractivo_natural","descripcion":"Actualizado"}'

# Eliminar
curl -X DELETE http://localhost:4001/api/destinos/1
```

También puedes probar a través del Gateway (`http://localhost:4000/api/destinos`) para confirmar que el proxy funciona.

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

## Cómo lo adapta Jaime para `alojamiento-service`

Mismo patrón, cambiando nombres:

1. `npm install mysql2` dentro de `services/alojamiento-service/`.
2. Tabla `alojamientos`:
   ```sql
   CREATE TABLE alojamientos (
     id INT AUTO_INCREMENT PRIMARY KEY,
     nombre VARCHAR(150) NOT NULL,
     municipio VARCHAR(100) NOT NULL,
     tipo ENUM('hotel', 'hostal', 'posada', 'apartamento') NOT NULL,
     precio_noche DECIMAL(10,2),
     servicios TEXT,
     imagen_url VARCHAR(500),
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```
3. Mismo `src/db.js` (copiar tal cual).
4. Mismas 5 rutas (`GET /api/alojamientos`, `GET /api/alojamientos/:id`, `POST`, `PUT`, `DELETE`), cambiando `destinos` por `alojamientos` y los campos del `INSERT`/`UPDATE` según la tabla de arriba.
5. Probar en el puerto `4002` en vez de `4001`.
6. Mismas dos pruebas del Paso 6, en `services/alojamiento-service/test/alojamientos.test.js` (cambiando la ruta del `POST` y los campos obligatorios: `nombre`, `municipio`, `tipo`).

## Cuando ya esté listo para producción

La tabla también hay que crearla en la base de datos de la nube (TiDB) para que funcione en Render. Eso lo coordina Sebastián — avísale cuando tu PR esté aprobado y lo agregamos allá.
