# Frontend — Sucre Turístico

App React con [Vite](https://vitejs.dev/), React Router, Axios y Bootstrap.

Las cinco secciones están conectadas al API Gateway: **Destinos**, **Alojamiento**, **Gastronomía**, **Experiencias** y **Eventos**. En producción: https://sucre-turistico-frontend.vercel.app

## Correrlo

```bash
npm install
npm run dev
```

Queda en http://localhost:3000. Necesita que el **API Gateway esté corriendo en el puerto 4000** (ver [`docs/DESARROLLO_LOCAL.md`](../docs/DESARROLLO_LOCAL.md)).

Si el gateway no está arriba, la página carga igual y muestra un mensaje de error: eso es a propósito, así se ve el manejo de errores funcionando.

Para probar contra los datos de producción sin levantar el back-end, crea `.env.local` (no se sube a git) con `VITE_API_URL=https://sucre-turistico.onrender.com`.

## Variables de entorno

`npm run setup` (desde la raíz del repo) crea el `.env` a partir de `.env.example`:

```
VITE_API_URL=http://localhost:4000
```

Vite **solo** expone al navegador las variables que empiezan por `VITE_`. Una variable sin ese prefijo no llega al código, aunque esté en el `.env`.

## Estructura

```
src/
├── api/
│   └── client.js           # Axios configurado + traducción de errores
├── components/             # Tarjeta* — solo presentan, reciben datos por props
│   ├── TarjetaDestino.jsx
│   ├── TarjetaAlojamiento.jsx
│   ├── TarjetaRestaurante.jsx
│   ├── TarjetaExperiencia.jsx
│   └── TarjetaEvento.jsx
├── pages/                  # una por sección: filtros + llamada a la API
│   ├── Destinos.jsx
│   ├── Alojamiento.jsx
│   ├── Gastronomia.jsx
│   ├── Experiencias.jsx
│   └── Eventos.jsx
├── App.jsx                 # rutas y navegación
└── main.jsx                # punto de entrada
```

## El patrón a seguir

Las cinco páginas siguen el mismo patrón (el original es `src/pages/Destinos.jsx`), cambiando el endpoint y los campos. Una página nueva debería copiarlo.

Tres cosas que toda página que llame a la API tiene que hacer:

**1. Manejar los tres estados.** No basta con pintar los datos:

```js
const [datos, setDatos] = useState([]);
const [cargando, setCargando] = useState(true);
const [error, setError] = useState(null);
```

En el render, los cuatro casos: cargando, error, lista vacía, y datos. Si te saltas alguno, el usuario ve una pantalla en blanco y no sabe si se rompió o está esperando. **El criterio 4 de la rúbrica pide explícitamente "gestionando adecuadamente las peticiones HTTP, errores y respuestas"** — esto es justo eso.

**2. Llamar siempre al Gateway, nunca a un microservicio directo.** Usa el cliente de `src/api/client.js`, que ya tiene la URL base y el token:

```js
const { data } = await api.get('/api/destinos', { params: { municipio } });
```

Nunca `axios.get('http://localhost:4001/...')`. Si lo haces directo, en producción no funciona y pierdes el sentido de tener un API Gateway.

**3. Cancelar si el componente se desmonta.** Si el usuario cambia de filtro rápido, llega primero una respuesta vieja y pisa la nueva:

```js
useEffect(() => {
  let cancelado = false;
  // ... if (!cancelado) setDatos(data);
  return () => { cancelado = true; };
}, [municipio]);
```

## Escrituras y autenticación

Los `GET` son públicos. Crear, editar y borrar exigen un token de administrador, que `src/api/client.js` manda solo si existe en `localStorage`. Ver [`docs/AUTENTICACION.md`](../docs/AUTENTICACION.md).

La pantalla de login y el panel de administración todavía no existen: es la historia 23 del backlog.

## Pendiente

- Buscador con facets (Sprint 3).
- Login y panel de administración.
- `recharts` para las gráficas, cuando se sepa qué se va a graficar.
