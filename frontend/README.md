# Frontend — Sucre Turístico

App React con [Vite](https://vitejs.dev/), React Router, Axios y Bootstrap.

Las cinco secciones están conectadas al API Gateway: **Destinos**, **Alojamiento**, **Gastronomía**, **Experiencias** y **Eventos**, más **Buscar** (`/buscar`), que busca en todas a la vez con autocompletado y facets. En producción: https://sucre-turistico-frontend.vercel.app

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
├── index.css               # sistema de diseño del prototipo (colores, tipografías, componentes st-*)
├── catalogo.js             # las 5 secciones: endpoint, ruta, etiquetas; y coordenadas de los municipios
├── imagenes.js             # foto de respaldo por categoría cuando un registro no tiene imagen
├── fechas.js               # formato de fechas de la API (sin que la zona horaria corra el día)
├── secciones.js            # las 5 secciones del menú
├── api/                    # client.js (Axios + reintentos), sesion.js, despertar.js
├── components/
│   ├── Encabezado.jsx, PiePagina.jsx, Logo.jsx, EncabezadoPagina.jsx
│   ├── Chips.jsx, EstadoLista.jsx, useCatalogo.js
│   ├── Cargando.jsx, useEsperaLarga.js   # tarjetas fantasma y aviso de "despertando servidores"
│   ├── Carrusel.jsx        # Swiper
│   ├── MapaMunicipios.jsx  # react-leaflet + OpenStreetMap, un círculo por municipio
│   └── Tarjeta*.jsx        # una por catálogo; toda la tarjeta enlaza a su detalle
├── pages/                  # Inicio, las 5 secciones, Detalle (/destinos/:id, …) y Buscador
├── admin/                  # login y panel de administración
├── App.jsx                 # rutas (detalle, buscador y panel se cargan aparte, con lazy)
└── main.jsx
```

**Página de detalle.** Una sola (`pages/Detalle.jsx`) para las cinco secciones: lee `GET /api/<sección>/:id` y arma la ficha según `catalogo.js`. Los restaurantes traen además su carta (`platos`, la relación 1-a-muchos del esquema). Abajo muestra un carrusel con otros de la misma sección, primero los del mismo municipio.

**Mapa.** La base no guarda coordenadas por lugar, así que el mapa ubica cada registro en el centro de su municipio (`COORDENADAS_MUNICIPIO`). Si algún día se agregan `latitud`/`longitud` a las tablas, basta con usarlas en `MapaMunicipios.jsx`.

El diseño sigue el prototipo de interfaz (`mokud/`): mismos colores, tipografías (Poppins e Inter) y componentes. Los estilos propios llevan el prefijo `st-` para no chocar con los de Bootstrap, que sigue haciendo la grilla y los formularios.

Sobre Bootstrap se suman librerías que lo complementan, sin reemplazarlo:

| Librería | Para qué |
|---|---|
| `react-bootstrap` | Componentes de Bootstrap en React: modales del panel y la hoja "Más" del celular |
| `lucide-react` | Íconos (se importan uno por uno, solo pesan los que se usan) |
| `motion` | Animaciones: entrada de páginas y tarjetas. Se carga con `LazyMotion` y respeta "reducir movimiento" del sistema |
| `sonner` | Avisos flotantes ("Cambios guardados") |
| `swiper` | Carruseles y la portada con fotos que rotan |
| `react-leaflet` | Mapas de OpenStreetMap |
| `cmdk` | Buscador instantáneo (`Ctrl+K`, la lupa o el buscador de la portada): filtra en el navegador los cinco catálogos, sin tildes ni mayúsculas, así que funciona aunque Elasticsearch no esté |
| `yet-another-react-lightbox` | Foto a pantalla completa con zoom en el detalle |

En el celular, el menú es una barra inferior fija (`BarraInferior.jsx`), como en una app.

Otros detalles: **favoritos** guardados en el navegador sin crear cuenta (`favoritos.js`, página `/favoritos`), **clima en vivo** de cada municipio con [Open-Meteo](https://open-meteo.com) (gratis, sin clave; `Clima.jsx`), y en el detalle botones de **compartir** (menú nativo del celular) y **WhatsApp** (si el lugar tiene celular registrado, abre el chat con él).

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

El panel está en `/admin` (enlace "Administrar" en el menú). Pide iniciar sesión en `/admin/login` y tiene una pestaña por entidad con su tabla para crear, editar y eliminar.

- `src/admin/entidades.js` — qué columnas y qué campos tiene cada entidad. Para agregar un campo o una entidad, se toca solo este archivo.
- `src/admin/TablaCrud.jsx` — la tabla y el formulario genéricos que leen esa configuración.
- `src/api/sesion.js` — iniciar y cerrar sesión. Si una petición vuelve 401 (token vencido), `client.js` borra la sesión y manda al login.

## Pendiente

- `recharts` para las gráficas, cuando se sepa qué se va a graficar.
