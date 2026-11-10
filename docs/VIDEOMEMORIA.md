# Guion de la videomemoria — Sucre Turístico

Duración objetivo: **10 minutos**. La rúbrica pide que **participen los cuatro**: cada uno presenta al menos un bloque con su voz (y, si pueden, con cámara en una esquina).

El reparto es una propuesta según lo que cada uno trabajó en los sprints; cámbienlo si alguien prefiere otra parte. Los textos son una guía para hablar con naturalidad, no para leer palabra por palabra.

## Antes de grabar (checklist)

- [ ] **El mismo día, antes de grabar:** `node scripts/probar-produccion.js` → debe decir **25/25**. Además de comprobar, despierta los servidores de Render (si no, la primera página tarda ~30 s en el video).
- [ ] **Elastic Cloud vigente:** la prueba vence hacia el **24 de noviembre de 2026**. Si graban después, el bloque 4 no funciona: graben antes.
- [ ] **Cuentas de demostración en producción**, creadas desde el panel por el superadmin:
  - un negocio de prueba (ej. "Hotel Mar de Coveñas") con un alojamiento asignado, y sus datos de acceso a mano;
  - una reserva de prueba hecha antes de grabar, para que la bandeja no salga vacía.
- [ ] Navegador en **ventana limpia** (sin pestañas ni marcadores personales), zoom al 100 %, pantalla 1920×1080.
- [ ] Una ventana de **incógnito** para entrar como el negocio sin cerrar la sesión del superadmin.
- [ ] El diagrama del README abierto en GitHub para el bloque 2.
- [ ] Grabar con OBS, Zoom o Teams (pantalla compartida). Cada bloque puede grabarse por separado y unirse al final.

## Bloques

| # | Tiempo | Quién | Tema |
|---|---|---|---|
| 1 | 0:00 – 1:00 | Sebastián | Presentación, problema y metodología |
| 2 | 1:00 – 2:30 | Sebastián | Arquitectura de microservicios |
| 3 | 2:30 – 4:30 | Halit | Recorrido del turista (frontend) |
| 4 | 4:30 – 5:45 | Jaime | Buscador con Elasticsearch y facets |
| 5 | 5:45 – 8:00 | Wilinton | Panel: roles de negocio y reservas |
| 6 | 8:00 – 9:15 | Jaime | Despliegue, seguridad y pruebas |
| 7 | 9:15 – 10:00 | Los cuatro | Cierre y aprendizajes |

---

### 1. Presentación (Sebastián · 1 min)

**En pantalla:** la portada de https://sucre-turistico-frontend.vercel.app (dejar que cambie de vista una vez).

> "Somos Sebastián, Halit, Jaime y Wilinton, de Electiva Profesional II en la UNIAJS. Les presentamos **Sucre Turístico**, una plataforma web para promocionar y gestionar el turismo del Golfo de Morrosquillo: destinos, alojamiento, gastronomía, experiencias y eventos en un solo lugar.
> Trabajamos con **Scrum** en cuatro sprints; yo fui el Scrum Master y organizamos las tareas en ClickUp y el código en GitHub, con ramas por funcionalidad y Pull Requests revisados."

**Mostrar 5 s:** el tablero de ClickUp o la lista de Pull Requests en GitHub.

### 2. Arquitectura (Sebastián · 1:30)

**En pantalla:** el diagrama de arquitectura del README en GitHub.

> "El frontend está hecho en **React** y nunca habla directo con los servicios: todo pasa por un **API Gateway** en Express, que valida el inicio de sesión y reparte cada petición.
> Detrás hay **seis microservicios** en Node.js: destinos, alojamiento, gastronomía, experiencias, eventos y el buscador. Los cinco primeros guardan en **MySQL**; el buscador usa **Elasticsearch**, y se llena leyendo las APIs de los demás, no su base de datos.
> Cada servicio tiene su **Dockerfile**, y con docker-compose levantamos todo en local con un comando."

**Mostrar 10 s:** la carpeta `services/` en GitHub y el `docker-compose.yml`.

### 3. Recorrido del turista (Halit · 2 min)

**En pantalla:** el sitio en producción. Orden sugerido:

1. **Portada:** "La portada cambia sola entre playas, naturaleza, gastronomía y el próximo evento real, con el clima en vivo de cada municipio."
2. **Explorar por categoría → Gastronomía:** filtros por tipo de cocina, municipio y precio.
3. **Abrir un restaurante:** "Cada lugar tiene su página: foto a pantalla completa, la **carta de platos típicos**, el **mapa**, el clima y lugares relacionados." Tocar **Ver foto**.
4. **Corazón ❤️** en una tarjeta → **Mis favoritos**: "Sin crear cuenta, el turista guarda lo que le interesa."
5. **`Ctrl+K`** y escribir "covenas" (sin tilde): "Un buscador instantáneo que encuentra aunque no pongas tildes."
6. **Celular** (vista de dispositivo del navegador, F12): la barra inferior tipo app.

> "Usamos Bootstrap como base y le sumamos librerías como React Bootstrap, Swiper, Leaflet y motion para que se sienta como una aplicación."

### 4. Buscador con Elasticsearch (Jaime · 1:15)

**En pantalla:** https://sucre-turistico-frontend.vercel.app/buscar

1. Buscar **"playa"**: "Busca en los cinco catálogos a la vez."
2. Señalar los **facets** de la izquierda con sus conteos y aplicar **Municipio: Coveñas** y luego un **rango de precio**: "Los facets se recalculan con cada filtro."
3. Escribir "rin" despacio en la caja: aparecen **sugerencias** (Rincón del Mar).

> "El índice usa un analizador en español que ignora tildes y reconoce plurales. Las sugerencias usan *search-as-you-type*. Está desplegado en **Elastic Cloud**, y el panel lo actualiza solo cada vez que un negocio cambia algo."

### 5. Panel: negocios y reservas (Wilinton · 2:15)

**En pantalla:** primero el sitio público, luego el panel.

1. **Como turista**, abrir el alojamiento del negocio de prueba → **Reservar estadía**, llenar fechas, huéspedes, nombre y teléfono → **"¡Solicitud enviada!"**. "El turista reserva sin crear cuenta."
2. **Ventana de incógnito → `/admin`**, entrar con la cuenta del negocio:
   > "Cada negocio tiene su propio panel, **Mi negocio**: solo ve y edita sus fichas."
   - La tarjeta **Reservas pendientes** con el contador → abrir la bandeja → mostrar el botón de **WhatsApp** → **Confirmar**.
   - En Alojamiento, el interruptor **"En el sitio"** para ocultar y volver a publicar.
3. **Ventana normal, como superadmin:**
   > "El superadministrador maneja los destinos y crea las cuentas de los negocios con una contraseña temporal, que el negocio cambia al primer ingreso."
   - **Negocios → Nueva cuenta de negocio** (mostrar los datos de acceso que genera).
   - Opcional: **Suspender** la cuenta de prueba y recargar el sitio público para mostrar que sus fichas desaparecen; luego **Reactivar**.

### 6. Despliegue, seguridad y pruebas (Jaime · 1:15)

**En pantalla:** los paneles de Vercel y Render, y una terminal.

> "El frontend está en **Vercel**, el gateway y los seis microservicios en **Render**, MySQL en **TiDB Cloud** y Elasticsearch en **Elastic Cloud**. Cada vez que unimos a `main`, todo se vuelve a desplegar solo, y en cada Pull Request **GitHub Actions** corre las pruebas y construye las imágenes Docker."

1. Mostrar la pestaña **Actions** de GitHub con los checks en verde.
2. En la terminal: `node scripts/probar-produccion.js` → **25/25**.
   > "Este script prueba producción de punta a punta: los catálogos, el buscador, y la seguridad."
3. Señalar en la salida las líneas **"POST directo a … es rechazado — 403"**:
   > "Los microservicios solo aceptan cambios que vengan del gateway, con un secreto compartido; y cada negocio solo puede tocar lo suyo aunque intente saltarse la pantalla."

### 7. Cierre (los cuatro · 45 s)

Cada uno, una frase sobre lo que más aprendió. Ideas:

- **Sebastián:** coordinar con Scrum y diseñar una arquitectura de microservicios que el equipo pudiera trabajar en paralelo.
- **Halit:** construir una interfaz en React que se sienta como una app y funcione igual en el celular.
- **Jaime:** desplegar varios servicios en la nube y conectarlos de forma segura.
- **Wilinton:** modelar roles y permisos reales, como los que necesita un negocio.

> "Gracias. El sitio está en sucre-turistico-frontend.vercel.app y el código en GitHub."

---

## Después de grabar

- Duración final entre 8 y 12 minutos; cortar silencios y esperas de carga.
- Subir a YouTube como **no listado** (o a Drive con acceso por enlace) y pegar el enlace en el README y en la entrega.
- Borrar desde el panel la cuenta y la reserva de prueba si no se van a usar más.
