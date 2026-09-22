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
- El API Gateway tiene las URLs de los 6 microservicios cargadas como variables de entorno (`DESTINOS_URL`, `ALOJAMIENTO_URL`, etc.) — el proxy ya fue probado y funciona end-to-end.

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

**El esquema hay que aplicarlo a mano.** En local, docker-compose ejecuta los archivos de `docs/sql/` solo; en TiDB no. Desde el SQL Editor de TiDB Cloud, pegar y ejecutar **en este orden**:

| Archivo | Estado en producción |
|---|---|
| [`01-usuarios.sql`](sql/01-usuarios.sql) | ✅ aplicado |
| [`02-municipios.sql`](sql/02-municipios.sql) | ⏳ pendiente |
| [`03-catalogo.sql`](sql/03-catalogo.sql) | ⏳ pendiente |
| [`04-datos-ejemplo.sql`](sql/04-datos-ejemplo.sql) | ⏳ pendiente (opcional: son datos de demo) |

El orden importa: `03` tiene llaves foráneas hacia `municipios`, así que `02` va primero.
- **En local (docker-compose) sigue usando el MySQL del contenedor**, no la nube — son ambientes separados a propósito, para no gastar la cuota gratis de TiDB con pruebas locales.

### Elasticsearch → pendiente a propósito
Elastic Cloud solo da **14 días gratis**. Si lo activamos ahora, el trial se acaba antes de llegar al Sprint 2 (que es cuando `buscador-service` realmente lo necesita). Activarlo cuando empiecen esa parte — ver [`SPRINT_PLAN.md`](SPRINT_PLAN.md).

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
- [x] Tabla `usuarios` creada en TiDB.
- [x] Esquema del catálogo definido y compartido (`docs/sql/02`, `03`, `04`).
- [ ] Aplicar `02`, `03` y `04` en TiDB.
- [ ] Crear el primer administrador en producción (`node scripts/crear-admin.js https://sucre-turistico.onrender.com`).
- [ ] Elastic Cloud — activar en Sprint 2.
- [ ] Código real de conexión a MySQL en cada microservicio — es el trabajo de Sprint 1/2 de cada quien, ver [`GUIA_CRUD_PASO_A_PASO.md`](GUIA_CRUD_PASO_A_PASO.md).
