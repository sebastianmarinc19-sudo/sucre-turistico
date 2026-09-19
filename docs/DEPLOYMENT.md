# Despliegue

Hay dos niveles de despliegue en este proyecto:

1. **Despliegue por rama / PR (preview)** — para que cada uno vea su propio trabajo en una URL sin afectar a los demás.
2. **Despliegue de producción** — lo que corre en `main`, la versión que se entrega/demuestra.

Ninguno de los dos existe todavía porque requieren cuentas (Vercel, Render/Railway, Elastic Cloud) que el equipo aún no ha creado. Esta guía es para cuando las tengan.

## 1. Preview deployments por rama (recomendado para trabajar en equipo)

### Front-end (Vercel)
1. Uno del equipo crea cuenta en [vercel.com](https://vercel.com) con GitHub.
2. "Add New Project" → importar el repo `sucre-turistico` → **Root Directory: `frontend`**.
3. Vercel despliega automáticamente:
   - Cada push a `main` → dominio de producción.
   - Cada Pull Request / rama → una URL de preview única (ej. `sucre-turistico-git-feature-x.vercel.app`), que se comenta sola en el PR.
4. Agregar la variable de entorno `VITE_API_URL` en Vercel (Settings → Environment Variables) apuntando al backend desplegado.

### Back-end (Render)
Render ofrece **Preview Environments** por Pull Request (gratis con límites, revisar plan actual):
1. Crear cuenta en [render.com](https://render.com) con GitHub.
2. Por cada servicio (`api-gateway`, `destinos-service`, etc.): "New Web Service" → conectar el repo → **Root Directory: `api-gateway`** (o el que corresponda) → Render detecta el `Dockerfile`.
3. En la configuración del servicio, activar "Preview Environments" para que cada PR genere una URL temporal.
4. Repetir para los 7 servicios (api-gateway + 6 microservicios).

> Alternativa más simple si Render resulta pesado de configurar 7 veces: usar **Railway**, que permite desplegar todo el `docker-compose.yml` como un solo proyecto con múltiples servicios.

### Base de datos y buscador
- MySQL: Render/Railway ofrecen bases de datos administradas. Usar una sola instancia compartida para todos los ambientes de desarrollo (no crear una por cada preview).
- Elasticsearch: [Elastic Cloud](https://www.elastic.co/cloud) tiene prueba gratuita de 14 días — suficiente para la duración del proyecto. Guardar el endpoint y API key como secret.

## 2. Producción (rama `main`)

El pipeline [`cd.yml`](../.github/workflows/cd.yml) ya está preparado para disparar el despliegue cuando se mergea a `main`, pero necesita los secrets configurados en GitHub:

`Settings del repo → Secrets and variables → Actions → New repository secret`

| Secret | De dónde sale |
|---|---|
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | Panel de Vercel → Settings |
| `RENDER_DEPLOY_HOOK_URL_<servicio>` | Cada servicio en Render → Settings → Deploy Hook |

Sin estos secrets, `cd.yml` corre pero solo imprime un mensaje (no rompe nada).

## 3. Checklist para dejarlo funcionando

- [ ] Repo en GitHub creado y con `main`/`develop` pusheadas.
- [ ] Cuenta Vercel conectada al repo (root: `frontend`).
- [ ] Cuenta Render/Railway conectada (root: `api-gateway` y cada `services/*`).
- [ ] Elastic Cloud con un deployment activo.
- [ ] Variables de entorno de producción cargadas en cada plataforma (no confundir con los `.env` locales).
- [ ] Secrets agregados en GitHub Actions para que `cd.yml` despliegue de verdad.

Esto lo hace la persona que vaya a administrar cada cuenta — normalmente conviene que sea una sola persona por plataforma para no duplicar proyectos.
