# Frontend — Sucre Turístico

Aún no está inicializado el proyecto React. Cuando empiecen el Sprint 3, la persona a cargo del frontend debe correr esto **dentro de esta carpeta**:

```bash
npm create vite@latest . -- --template react
npm install
npm install react-router-dom axios bootstrap recharts
```

(Vite en vez de create-react-app: arranca más rápido y es el estándar actual para React con JavaScript.)

## Variables de entorno

Crear un archivo `.env` (no se sube al repo, ya está en `.gitignore`):

```
VITE_API_URL=http://localhost:4000
```

En el código, usar `import.meta.env.VITE_API_URL` como base para las llamadas con Axios al API Gateway.

## Estructura sugerida

```
frontend/src/
├── pages/          # Destinos, Hoteles, Restaurantes, Experiencias, Eventos, Buscador
├── components/      # componentes reutilizables (Card, Filtro, Navbar, etc.)
├── services/        # funciones Axios por recurso (destinosApi.js, etc.)
└── App.jsx          # rutas con React Router
```

Después de inicializar el proyecto, agregar aquí mismo un `Dockerfile` (pueden pedirme que lo genere cuando ya exista el `package.json` real, para que coincida con el build tool elegido).
