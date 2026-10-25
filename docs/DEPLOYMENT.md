# Despliegue

## Estado actual

| Componente | Plataforma | Estado | URL |
|---|---|---|---|
| Frontend | Vercel | ✅ Desplegado | https://sucre-turistico-frontend.vercel.app |
| API Gateway | Render (free) | ✅ Desplegado | https://sucre-turistico.onrender.com |
| destinos-service | Render (free) | ✅ Desplegado | https://sucre-turistico-destinos-service.onrender.com |
| alojamiento-service | Render (free) | ✅ Desplegado | https://sucre-turistico-alojamiento-service.onrender.com |
| gastronomia-service | Render (free) | ✅ Desplegado | https://sucre-turistico-gastronomia-service.onrender.com |
| experiencias-service | Render (free) | ✅ Desplegado | https://sucre-turistico-experiencias-service.onrender.com |
| eventos-service | Render (free) | ✅ Desplegado | https://sucre-turistico-eventos-service.onrender.com |
| buscador-service | Render (free) | ✅ Desplegado | https://sucre-turistico-buscador-service.onrender.com |
| Base de datos MySQL | TiDB Cloud Starter (free, MySQL-compatible) | ✅ Creada | ver credenciales en Render → Environment Groups → `mysql-tidb`, o en TiDB Cloud |
| Elasticsearch | — | ⏳ Pendiente (a propósito, ver abajo) | — |

Todo lo anterior corre en planes **$0/mes**, sin tarjeta.

## Cómo quedó armado

### Frontend → Vercel
- Proyecto `sucre-turistico-frontend`, Root Directory: `frontend`, framework Vite.
- Cada push a `main` → producción. Cada rama/PR → URL de preview automática (ya viene activado por defecto en Vercel).
- `VITE_API_URL=https://sucre-turistico.onrender.com` ya está configurada en Production. Verificado: la URL viene compilada dentro del bundle publicado, no queda ningún `localhost:4000`.
  > Vite **hornea** las variables `VITE_*` en el build. Cambiar el valor en Vercel no surte efecto hasta que se vuelva a desplegar.
- [`frontend/vercel.json`](../frontend/vercel.json) reenvía todas las rutas a `index.html`. Sin eso, `react-router` funciona al navegar por el menú pero devuelve **404 al refrescar** o al abrir un link directo como `/eventos`.

### Backend → Render
- 7 Web Services (api-gateway + 6 microservicios), cada uno con Root Directory apuntando a su carpeta y Dockerfile propio, plan **Free**.
- Auto-deploy activado: cada push a `main` redespliega solo.
- **Importante:** los servicios free "duermen" tras 15 min sin tráfico y tardan ~50s en la primera respuesta después de eso. Es normal, no es un error.
  - **Ojo:** si el API Gateway llama a un servicio dormido, Render le responde **429** al instante y **no lo despierta**. Por eso el frontend hace un ping directo a cada microservicio al cargar ([`frontend/src/api/despertar.js`](../frontend/src/api/despertar.js)) y reintenta las lecturas que reciben 429 mientras arrancan ([`client.js`](../frontend/src/api/client.js)). Si se agrega un microservicio, hay que sumarlo a esa lista.
  - No sirve mantenerlos despiertos con un ping periódico: el plan free da 750 horas/mes para todos los servicios juntos, y 7 servicios encendidos todo el mes son ~5.000.
- El API Gateway tiene las URLs de los 6 microservicios cargadas como variables de entorno (`DESTINOS_URL`, `ALOJAMIENTO_URL`, etc.) — el proxy ya fue probado y funciona end-to-end.

#### `GATEWAY_SECRET`: que nadie se salte el login
Cada microservicio tiene su propia URL pública en Render, y el token de administrador solo lo revisa el gateway. Sin protección, cualquiera podría crear o borrar datos llamando directo a `https://sucre-turistico-destinos-service.onrender.com/api/destinos`.

Por eso el gateway manda la cabecera `X-Gateway-Secret` en todo lo que reenvía, y cada servicio ([`src/solo-gateway.js`](../services/destinos-service/src/solo-gateway.js)) rechaza las escrituras que no la traen: **403**, o **503** si al servicio le falta la variable. Los GET siguen siendo públicos.

Configuración en Render (una sola vez):
1. Generar un valor: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
2. **Environment Groups → New** → nombre `gateway-secret`, variable `GATEWAY_SECRET` = ese valor.
3. Enlazar el grupo a los **7 servicios**: el gateway y los 6 microservicios. Render los redespliega solo.

Si falta en algún servicio, el panel de administración no puede guardar en esa sección: el mensaje de error dice exactamente qué variable falta.

### Base de datos → TiDB Cloud (MySQL-compatible)
Se eligió TiDB Cloud Starter en vez de Railway (pide tarjeta) o db4free.net (dominio comprometido/redirige a un sitio sospechoso — no usar) porque:
- Es 100% gratis (5GiB storage, 50M request units/mes), sin tarjeta.
- Es compatible con el driver de MySQL de Node (`mysql2`) sin cambios de código.

Configuración:
- Cluster: `sucre-turistico-db`, base de datos `sucre_turistico` ya creada.
- Las credenciales están cargadas como un **Environment Group** en Render llamado `mysql-tidb`, enlazado a los 5 microservicios que usan base de datos relacional (`destinos`, `alojamiento`, `gastronomia`, `experiencias`, `eventos`). `buscador-service` no lo necesita (usa Elasticsearch).
- Variables disponibles en esos 5 servicios: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL`.
- **TiDB requiere conexión SSL.** Al conectar con `mysql2` en Node, usar algo como:
  ```js
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? {} : undefined,
  });
  ```
- Para ver o rotar la contraseña: [tidbcloud.com](https://tidbcloud.com) → cluster `sucre-turistico-db` → Connect.

**El esquema hay que aplicarlo a mano.** En local, docker-compose ejecuta los archivos de `docs/sql/` solo; en TiDB no. Desde la raíz del repo:

```bash
node scripts/aplicar-esquema.js              # tablas + datos de ejemplo
node scripts/aplicar-esquema.js --sin-datos  # solo tablas
```

Pide la contraseña de TiDB sin mostrarla, aplica los archivos **en este orden** y muestra cuántas filas quedan en cada tabla. Se puede correr varias veces sin duplicar nada (`04` se salta si `destinos` ya tiene filas). La alternativa es pegarlos uno por uno en el SQL Editor de TiDB Cloud, en el mismo orden:

| Archivo | Estado en producción |
|---|---|
| [`01-usuarios.sql`](sql/01-usuarios.sql) | ✅ aplicado |
| [`02-municipios.sql`](sql/02-municipios.sql) | ✅ aplicado |
| [`03-catalogo.sql`](sql/03-catalogo.sql) | ✅ aplicado |
| [`04-datos-ejemplo.sql`](sql/04-datos-ejemplo.sql) | ✅ aplicado (datos de demo) |
| [`05-mas-datos.sql`](sql/05-mas-datos.sql) | ✅ aplicado (segunda tanda de demo; idempotente, se aplica siempre) |

El orden importa: `03` tiene llaves foráneas hacia `municipios`, así que `02` va primero.
- **En local (docker-compose) sigue usando el MySQL del contenedor**, no la nube — son ambientes separados a propósito, para no gastar la cuota gratis de TiDB con pruebas locales.

### Elasticsearch → pendiente a propósito
Elastic Cloud solo da **14 días gratis**, que empiezan a contar al crear la cuenta. Por eso `buscador-service` se desarrolló y probó en local (Elasticsearch en docker-compose) y se despliega **pocos días antes de la entrega final**.

Cuando toque desplegarlo:

1. En [cloud.elastic.co](https://cloud.elastic.co) crear un deployment (Elasticsearch 8.x). Copiar el **endpoint de Elasticsearch** y crear una **API key**.
2. En Render, servicio `sucre-turistico-buscador-service` → Environment:
   - `ELASTICSEARCH_HOST` = el endpoint (empieza por `https://`)
   - `ELASTICSEARCH_API_KEY` = la API key (en base64, tal como la entrega Elastic)
   - `DESTINOS_URL`, `ALOJAMIENTO_URL`, `GASTRONOMIA_URL`, `EXPERIENCIAS_URL`, `EVENTOS_URL` = las URLs públicas de cada microservicio (las de la tabla de arriba). El buscador indexa leyendo sus APIs.
3. Merge a `main` para que Render redespliegue. Al arrancar, si el índice `turismo_index` no existe, se crea y se llena solo.
4. Después de crear o editar contenido en el panel, usar **"Actualizar buscador"** (o `POST /api/buscador/reindexar` con token de admin).
5. Agregar el buscador a la lista de `frontend/src/api/despertar.js` y de `scripts/probar-produccion.js`, para que también se despierte y se pruebe.

## Comprobar que producción funciona

```bash
node scripts/probar-produccion.js
```

En ~1 minuto despierta los microservicios y comprueba los 5 catálogos a través del gateway, que una escritura sin token sea rechazada, que exista un administrador y que el frontend responda. No escribe nada en la base. **Córranlo antes de cada demo**: además de verificar, deja todo despierto.

## Por qué no hay workflow de CD

Existió un `cd.yml`, pero solo imprimía `echo "TODO"` y aun así reportaba **success** en cada push a `main`. Un pipeline que siempre pasa es peor que no tenerlo: enseña al equipo a confiar en una luz verde que no significa nada. Se eliminó.

El despliegue real ya lo hacen Vercel y Render por su cuenta: los dos están conectados al repositorio y redespliegan solos con cada push a `main`. No hace falta un workflow para eso.

## Checklist

- [x] Repo en GitHub con `main`/`develop`.
- [x] Vercel conectado (frontend).
- [x] Render conectado (api-gateway + 6 microservicios).
- [x] Base de datos MySQL (TiDB Cloud) creada y enlazada.
- [x] `VITE_API_URL` en Vercel apuntando al backend.
- [x] `JWT_SECRET` en el API Gateway.
- [ ] `GATEWAY_SECRET` en el gateway y los 6 microservicios (Environment Group `gateway-secret`, pasos arriba).
- [x] Tabla `usuarios` creada en TiDB.
- [x] Esquema del catálogo definido y compartido (`docs/sql/02`, `03`, `04`).
- [x] Aplicar `02`, `03` y `04` en TiDB.
- [ ] Crear el primer administrador en producción (`node scripts/crear-admin.js https://sucre-turistico.onrender.com`).
- [ ] Elastic Cloud — crear el deployment y configurar `buscador-service` en Render (pasos arriba), pocos días antes de la entrega.
- [x] Código real de conexión a MySQL en los 5 microservicios con base de datos (CRUD de destinos, alojamiento, gastronomía, experiencias y eventos).
