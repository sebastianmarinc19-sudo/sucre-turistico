# Frontend — Sucre Turístico

App React inicializada con [Vite](https://vitejs.dev/).

## Desarrollo local

```bash
npm install
npm run dev
```

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

## Dependencias pendientes de instalar cuando se empiece a maquetar

```bash
npm install react-router-dom axios bootstrap recharts
```
