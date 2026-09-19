# Guía de configuración de ClickUp

Yo no puedo crear esto por ustedes (requiere iniciar sesión con su cuenta), pero acá está todo listo para que lo monten en ~15 minutos. Ideal: que Sebastián (Scrum Master) lo cree y agregue a Halit y Jaime como miembros.

## 1. Crear el Workspace

1. Entrar a [clickup.com](https://clickup.com) y crear una cuenta (o iniciar sesión).
2. Crear un **Workspace** llamado `Sucre Turístico`.
3. Invitar a los otros dos integrantes por correo (Settings → Invite people).

## 2. Crear el Space

Dentro del workspace, crear un **Space**: `Proyecto Integrador`.

En la configuración del Space, habilitar:
- **Sprints** (ClickApp) — para trabajar con sprints con fecha de inicio/fin.
- **Custom Fields**.

## 3. Crear los Custom Fields

En el Space, crear estos campos personalizados (se aplican a todas las tareas):

| Campo | Tipo | Opciones |
|---|---|---|
| Microservicio | Dropdown | `frontend`, `api-gateway`, `destinos-service`, `alojamiento-service`, `gastronomia-service`, `experiencias-service`, `eventos-service`, `buscador-service`, `infra` |
| Responsable | Personas | Sebastián, Halit, Jaime |
| Criterio rúbrica | Dropdown | `1-Microservicios`, `2-Buscador`, `3-Facets`, `4-Integración`, `5-Despliegue`, `6-Documentación` |

## 4. Crear los Statuses (flujo Kanban/Scrum)

Reemplazar los estados por defecto por:

```
BACKLOG → TO DO → EN PROGRESO → EN REVISIÓN (PR) → DONE
```

## 5. Crear las Lists (una por sprint)

Dentro del Space, crear 4 Lists usando la función de **Sprints**:

- `Sprint 1 - Arquitectura y microservicios base`
- `Sprint 2 - Resto de microservicios + Buscador`
- `Sprint 3 - Facets + Integración Front-End`
- `Sprint 4 - Despliegue y cierre`

Asignar fecha de inicio/fin a cada sprint según su calendario académico.

## 6. Cargar las tareas

Copiar las tareas de [`SPRINT_PLAN.md`](SPRINT_PLAN.md) en la List del sprint correspondiente. Por cada tarea, completar:
- **Nombre**: igual al de la tabla (ej. "CRUD destinos-service (municipios, playas, atractivos)").
- **Asignado**: el responsable indicado.
- **Microservicio**: el custom field correspondiente.
- **Criterio rúbrica**: a qué criterio de la rúbrica aporta.
- **Status**: `BACKLOG` inicialmente.

Tip: ClickUp permite pegar una lista de tareas separadas por línea (uno por renglón) y crea una tarea por cada una — pueden pegar las columnas "Tarea" de `SPRINT_PLAN.md` directamente.

## 7. Historias de usuario como referencia

Crear una List adicional `Product Backlog` (sin sprint) y cargar ahí las 19 historias de [`BACKLOG.md`](BACKLOG.md), como referencia de por qué existe cada tarea técnica. Se pueden enlazar (relación "linked task") entre una historia y las tareas técnicas que la resuelven.

## 8. Reunión diaria / seguimiento (opcional pero recomendado)

Sebastián puede crear una vista **Board** (Kanban) del Space para usarla en un daily corto (5-10 min, 2-3 veces por semana): cada quien mueve sus tarjetas y comenta bloqueos.

## 9. Conectar con GitHub (opcional)

Si quieren que los PRs muevan automáticamente las tareas a "EN REVISIÓN" o "DONE":
1. En ClickUp: Settings → Integrations → GitHub → conectar la cuenta.
2. En cada Pull Request, incluir `CU-<id de la tarea>` en el título o descripción (ClickUp genera el id, ej. `CU-abc123`) para que quede enlazado automáticamente.
