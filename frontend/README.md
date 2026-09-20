# Frontend — Sucre Turístico

App React con [Vite](https://vitejs.dev/), React Router, Axios y Bootstrap.

> ## ⚠️ Lee esto antes de tocar nada
>
> **Solo hay una página implementada: `src/pages/Destinos.jsx`.** Es un **ejemplo trabajado**, no la app terminada. Existe para que copies el patrón, no para que la uses tal cual.
>
> Las páginas de alojamiento, gastronomía, experiencias y eventos son marcadores de posición en `App.jsx`. Hacerlas es el trabajo del Sprint 3.
>
> **Si abres la app y Destinos muestra un error, no está roto.** Falta el CRUD de `destinos-service` en el back-end (ver [`docs/GUIA_CRUD_PASO_A_PASO.md`](../docs/GUIA_CRUD_PASO_A_PASO.md)). Cuando ese endpoint exista, la página se llena sola.
>
> Hay un aviso azul en pantalla explicando lo mismo. **Bórrenlo antes de la entrega final** — está en `App.jsx`, se llama `AvisoDemo`.

## Correrlo

```bash
npm install
npm run dev
```

Queda en http://localhost:3000. Necesita que el **API Gateway esté corriendo en el puerto 4000** (ver [`docs/DESARROLLO_LOCAL.md`](../docs/DESARROLLO_LOCAL.md)).

Si el gateway no está arriba, la página carga igual y muestra un mensaje de error: eso es a propósito, así se ve el manejo de errores funcionando.

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
├── components/
│   └── TarjetaDestino.jsx  # componente de presentación, recibe props
├── pages/
│   └── Destinos.jsx        # página completa: filtros + llamada a la API
├── App.jsx                 # rutas y navegación
└── main.jsx                # punto de entrada
```

## El patrón a seguir

**`src/pages/Destinos.jsx` es el ejemplo trabajado.** Las demás páginas (alojamiento, gastronomía, experiencias, eventos) son el mismo patrón cambiando el endpoint y los campos. Ahora mismo son marcadores de posición en `App.jsx`.

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

- Páginas de alojamiento, gastronomía, experiencias y eventos.
- Buscador con facets (Sprint 3).
- Login y panel de administración.
- `recharts` para las gráficas, cuando se sepa qué se va a graficar.
