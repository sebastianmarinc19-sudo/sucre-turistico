# Product Backlog — Sucre Turístico

Historias de usuario derivadas de la actividad. Formato: `Como <usuario>, quiero <acción>, para <beneficio>`.
La columna **Épica** sirve para agrupar las tareas equivalentes en ClickUp.

## Épica: Destinos

| # | Historia de usuario | Prioridad |
|---|---|---|
| 1 | Como turista, quiero explorar destinos por municipio, para planear mi viaje. | Alta |
| 2 | Como turista, quiero consultar información de playas, para elegir dónde ir. | Alta |
| 3 | Como administrador, quiero registrar y editar destinos/atractivos, para mantener la información actualizada. | Alta |

## Épica: Alojamiento

| # | Historia de usuario | Prioridad |
|---|---|---|
| 4 | Como turista, quiero buscar hoteles/hostales/posadas, para elegir dónde hospedarme. | Alta |
| 5 | Como turista, quiero ver el detalle y servicios de un alojamiento, para decidir si me conviene. | Media |
| 6 | Como administrador, quiero administrar el catálogo de hoteles, para mantenerlo actualizado. | Alta |

## Épica: Gastronomía

| # | Historia de usuario | Prioridad |
|---|---|---|
| 7 | Como turista, quiero consultar restaurantes y platos típicos, para saber dónde comer. | Media |
| 8 | Como administrador, quiero gestionar restaurantes y categorías gastronómicas, para mantener la oferta actualizada. | Media |

## Épica: Experiencias

| # | Historia de usuario | Prioridad |
|---|---|---|
| 9 | Como turista, quiero encontrar tours y actividades (acuáticas, culturales), para vivir experiencias en la región. | Media |
| 10 | Como administrador, quiero registrar experiencias y operadores turísticos, para ampliar la oferta. | Media |

## Épica: Eventos

| # | Historia de usuario | Prioridad |
|---|---|---|
| 11 | Como turista, quiero consultar eventos y festividades por fecha, para planear mi visita. | Media |
| 12 | Como administrador, quiero gestionar eventos (crear, editar, fechas, ubicación), para mantener la agenda actualizada. | Media |

## Épica: Buscador (Elasticsearch)

| # | Historia de usuario | Prioridad |
|---|---|---|
| 13 | Como turista, quiero buscar por texto libre (full-text) en toda la plataforma, para encontrar información rápido. | Alta |
| 14 | Como turista, quiero ver sugerencias mientras escribo (search-as-you-type / autocompletado), para agilizar la búsqueda. | Alta |
| 15 | Como turista, quiero filtrar resultados con facets (municipio, categoría, tipo, precio), para refinar mi búsqueda. | Alta |

## Épica: Administración y acceso

| # | Historia de usuario | Prioridad |
|---|---|---|
| 20 | Como administrador, quiero iniciar sesión con usuario y contraseña, para acceder al panel de gestión. | Alta |
| 21 | Como equipo, queremos que solo un administrador autenticado pueda crear/editar/borrar contenido, para que nadie modifique la información desde internet. | Alta |
| 22 | Como turista, quiero consultar toda la información sin necesidad de crear una cuenta, para explorar sin fricción. | Alta |
| 23 | Como administrador, quiero una pantalla de login y un panel para gestionar el contenido, para no depender de Postman. | Alta |

> Las historias 20-22 ya están implementadas en el API Gateway (ver [`AUTENTICACION.md`](AUTENTICACION.md)). La 23 es trabajo de front-end.

## Épica: Plataforma / Infraestructura

| # | Historia de usuario | Prioridad |
|---|---|---|
| 16 | Como equipo, queremos un API Gateway que centralice las rutas hacia los microservicios. | Alta |
| 17 | Como equipo, queremos contenerizar cada servicio con Docker para desarrollo y despliegue consistentes. | Alta |
| 18 | Como equipo, queremos desplegar el front-end, back-end, base de datos y buscador en un entorno público. | Alta |
| 19 | Como equipo, queremos documentación técnica y una videomemoria del proyecto. | Alta |

Estas historias son la base para crear las **tareas en ClickUp** (ver [`CLICKUP_SETUP.md`](CLICKUP_SETUP.md)) y para repartir el trabajo en [`SPRINT_PLAN.md`](SPRINT_PLAN.md).
