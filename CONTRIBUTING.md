# Guía de colaboración en equipo

Somos 3 personas trabajando en el mismo repositorio. Estas reglas evitan que nos pisemos el código y mantienen el historial legible para el video/documentación final.

## 1. Ramas (Git Flow simplificado)

- `main` → siempre desplegable. Nadie sube directo aquí.
- `develop` → rama de integración. Todas las features se unen aquí primero.
- `feature/<microservicio>-<tarea>` → una rama por tarea. Ejemplos:
  - `feature/destinos-crud-municipios`
  - `feature/frontend-pagina-hoteles`
  - `feature/buscador-elasticsearch-index`

Flujo:

```bash
git checkout develop
git pull
git checkout -b feature/destinos-crud-municipios
# ... trabajar y commitear ...
git push origin feature/destinos-crud-municipios
# abrir Pull Request hacia develop
```

Cuando `develop` esté estable y probado, se hace merge a `main` para desplegar.

## 2. Commits (Conventional Commits)

Formato: `tipo: descripción corta en imperativo`

| Tipo       | Cuándo usarlo                              |
|------------|---------------------------------------------|
| `feat`     | nueva funcionalidad                         |
| `fix`      | corrección de un bug                        |
| `docs`     | cambios solo de documentación               |
| `style`    | formato, sin cambios de lógica              |
| `refactor` | cambio de código que no agrega ni arregla nada |
| `test`     | agregar o corregir pruebas                  |
| `chore`    | configuración, dependencias, CI/CD          |

Ejemplos:
```
feat: agregar endpoint GET /api/destinos
fix: corregir filtro de precio en buscador
docs: actualizar README con instrucciones de despliegue
```

## 3. Pull Requests

- Todo cambio a `develop` o `main` pasa por PR, incluso si lo hace uno solo.
- Al menos **1 revisión de otro integrante** antes de mergear (los 3 nos turnamos para revisar).
- El PR debe describir: qué hace, cómo probarlo, y qué issue/tarea de ClickUp resuelve (pega el link de la tarea).
- Si el PR rompe el build (ver CI en GitHub Actions), no se mergea hasta corregirlo.

## 4. División de trabajo por microservicio

Para minimizar conflictos, cada persona es responsable principal de ciertos microservicios (ver [`SPRINT_PLAN.md`](docs/SPRINT_PLAN.md)), pero cualquiera puede hacer PRs a cualquier servicio.

## 5. Antes de cada sprint

Reunión corta (15-20 min) para:
1. Revisar qué se completó del sprint anterior.
2. Mover tareas del Backlog a "To Do" en ClickUp.
3. Repartir las tareas del sprint.

El Scrum Master (Sebastián) modera la reunión y actualiza el tablero de ClickUp.
