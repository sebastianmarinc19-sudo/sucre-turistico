# Plan de Sprints — Sucre Turístico

Basado en los criterios de la rúbrica (10 pts / 100%). 4 sprints de ~1-2 semanas cada uno (ajusten las fechas a su calendario académico). El Scrum Master (Sebastián) es responsable de mover las tareas en ClickUp y moderar las reuniones; el trabajo de código se reparte entre los 3.

> Los nombres asignados son una propuesta de reparto equilibrado. Ajústenla según disponibilidad real de cada uno — lo importante es que todos toquen back-end, front-end y despliegue al menos una vez.

## Sprint 1 — Arquitectura y base de microservicios
*Cubre criterio 1 (Arquitectura y desarrollo de microservicios — 15%)*

| Tarea | Responsable | Servicio |
|---|---|---|
| Inicializar repositorio, estructura de carpetas, docker-compose base | Sebastián | infra |
| Scaffold API Gateway (Express, rutas base, proxy a servicios) | Sebastián | api-gateway |
| CRUD `destinos-service` (municipios, playas, atractivos) | Halit | destinos-service |
| CRUD `alojamiento-service` (hoteles, hostales, posadas) | Jaime | alojamiento-service |
| Definir esquema de base de datos MySQL (tablas, relaciones) | Todos (diseño conjunto) | — |

## Sprint 2 — Resto de microservicios + Buscador
*Cubre criterio 2 (Buscador con Elasticsearch — 15%) y avanza criterio 1*

| Tarea | Responsable | Servicio |
|---|---|---|
| CRUD `gastronomia-service` | Halit | gastronomia-service |
| CRUD `experiencias-service` | Jaime | experiencias-service |
| CRUD `eventos-service` | Sebastián | eventos-service |
| Levantar Elasticsearch, definir índice `turismo_index` | Sebastián | buscador-service |
| Implementar búsqueda full-text y search-as-you-type | Halit + Jaime (pareja) | buscador-service |

## Sprint 3 — Filtros/Facets + Integración Front-End
*Cubre criterio 3 (Filtros y Facets — 15%) y criterio 4 (Integración Front-Back — 25%, el de mayor peso)*

| Tarea | Responsable | Servicio |
|---|---|---|
| Implementar facets (municipio, categoría, tipo, precio) | Sebastián | buscador-service |
| Maquetar páginas React (destinos, hoteles, restaurantes, experiencias, eventos) | Halit | frontend |
| Conectar React con API Gateway (Axios, manejo de errores/loading) | Jaime | frontend |
| Reemplazar datos de prueba (mock) por datos reales de la API | Todos | frontend |

## Sprint 4 — Despliegue y cierre
*Cubre criterio 5 (Despliegue — 20%) y criterio 6 (Documentación y videomemoria — 10%)*

| Tarea | Responsable | Servicio |
|---|---|---|
| Dockerizar todos los servicios + docker-compose de producción | Sebastián | infra |
| Desplegar front-end en Vercel | Halit | infra |
| Desplegar back-end (Gateway + microservicios) en Render/Railway | Jaime | infra |
| Desplegar Elasticsearch en Elastic Cloud y conectar | Sebastián | infra |
| Pruebas end-to-end en el entorno desplegado | Todos | — |
| Documentación técnica final | Todos (una sección c/u) | docs |
| Grabar videomemoria (todos deben participar, según rúbrica) | Todos | — |

## Definition of Done (por tarea)

Una tarea se marca "Done" en ClickUp solo si:
- El código está en `develop` vía Pull Request revisado por otro integrante.
- Tiene al menos una prueba manual (Postman/navegador) documentada en el PR.
- No rompe el pipeline de CI (ver `.github/workflows/`).
