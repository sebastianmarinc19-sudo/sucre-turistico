# Sucre Turístico

Plataforma Web Full Stack para la Promoción y Gestión Turística del Golfo de Morrosquillo.
Proyecto Integrador — Electiva II, Corporación Universitaria Antonio José de Sucre (UNIAJS).

## Equipo

| Nombre    | Rol           |
|-----------|---------------|
| Sebastián | Scrum Master  |
| Halit     | Equipo de desarrollo |
| Jaime     | Equipo de desarrollo |

## Documentos del proyecto

- [`docs/BACKLOG.md`](docs/BACKLOG.md) — historias de usuario del producto.
- [`docs/SPRINT_PLAN.md`](docs/SPRINT_PLAN.md) — planificación de sprints y asignación de trabajo.
- [`docs/CLICKUP_SETUP.md`](docs/CLICKUP_SETUP.md) — guía paso a paso para montar el tablero en ClickUp.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — cómo conectar Vercel/Render/Elastic Cloud y despliegues por rama (preview).
- [`docs/AUTENTICACION.md`](docs/AUTENTICACION.md) — rol de administrador, login con JWT y cómo crear el primer admin.
- [`docs/GUIA_CRUD_PASO_A_PASO.md`](docs/GUIA_CRUD_PASO_A_PASO.md) — tutorial para implementar el CRUD de un microservicio contra MySQL, de principio a fin.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — flujo de Git, convención de commits y proceso de Pull Request.

## Arquitectura

- **Front-End:** React (JavaScript ES6+, Bootstrap, React Router, Axios, Recharts).
- **Back-End:** Node.js + Express, arquitectura de microservicios detrás de un API Gateway.
- **Microservicios:** `destinos`, `alojamiento`, `gastronomia`, `experiencias`, `eventos`, `buscador`.
- **Bases de datos:** MySQL (datos estructurados), Elasticsearch (búsqueda full-text, facets, sugerencias).
- **Contenerización:** Docker + Docker Compose.
- **Despliegue:** Front-end en Vercel, back-end en Render/Railway, Elasticsearch en Elastic Cloud.

## Estructura del repositorio

```
sucre-turistico/
├── frontend/                  # App React
├── api-gateway/                # Express API Gateway
├── services/
│   ├── destinos-service/
│   ├── alojamiento-service/
│   ├── gastronomia-service/
│   ├── experiencias-service/
│   ├── eventos-service/
│   └── buscador-service/       # Integración con Elasticsearch
├── docs/
├── .github/workflows/          # Pipelines de CI/CD
└── docker-compose.yml
```

## Quickstart (clonar y arrancar)

Requisitos: **Node.js 18+**, **Docker Desktop**, **Git**.

```bash
git clone <URL-DEL-REPO>
cd sucre-turistico
git checkout develop

npm install        # instala dependencias de api-gateway y todos los services (npm workspaces)
npm run setup      # crea los .env de cada servicio a partir de sus .env.example

npm run up         # equivalente a: docker compose up --build
```

- Front-end: http://localhost:3000 (una vez exista, ver [`frontend/README.md`](frontend/README.md))
- API Gateway: http://localhost:4000/health
- Cada microservicio: http://localhost:400X/health (`destinos`=4001, `alojamiento`=4002, `gastronomia`=4003, `experiencias`=4004, `eventos`=4005, `buscador`=4006)
- Elasticsearch: http://localhost:9200

Para bajar los contenedores: `npm run down`. Para ver logs: `npm run logs`.

## Trabajar en tu rama

```bash
git checkout develop
git pull
git checkout -b feature/<microservicio>-<tarea>
# ... programar ...
git push origin feature/<microservicio>-<tarea>
```

Abrir el Pull Request contra `develop` en GitHub. Una vez configurado Vercel/Render (ver [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)), cada rama/PR genera automáticamente su propia URL de preview para probar sin afectar a los demás.

Ver [`CONTRIBUTING.md`](CONTRIBUTING.md) para la convención de commits y el proceso de revisión antes de empezar a programar.
