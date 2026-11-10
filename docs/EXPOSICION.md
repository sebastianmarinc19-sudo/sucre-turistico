# Guion de la exposición — Sucre Turístico

**Duración:** 10 minutos más preguntas. **Participan los cuatro** (lo pide la rúbrica).

**La idea:** mostrar el sitio **funcionando en vivo** y usar las diapositivas como hilo y como respaldo. Cada diapositiva de demo trae capturas de lo mismo que se muestra en vivo: si internet o Render fallan, se sigue con la diapositiva sin detenerse.

Las diapositivas están en el Artifact "Sucre Turístico — Exposición" (se pueden presentar desde el navegador o descargar como PowerPoint/PDF). Cada una tiene en sus **notas del orador** lo que dice quien presenta.

## Reglas para que salga bien

1. **No leer las diapositivas.** Tienen poco texto a propósito: se dice la idea con palabras propias y se señala la evidencia.
2. **Una idea por persona y por bloque.** Si sobra tiempo, se usan los "opcionales"; si falta, se saltan.
3. **Cada cambio de turno tiene una frase de paso** (está al final de cada bloque). Así no hay silencios de "¿a quién le toca?".
4. **Quien no está hablando, maneja el computador** del que habla, o se queda quieto; nada de hablar por encima.
5. **Números reales.** Todo lo que se dice salió del sistema el 10 de noviembre de 2026; si se vuelve a correr la prueba antes de exponer y cambia algún número, se dice el nuevo.

## Antes de exponer (checklist)

- [ ] **10 minutos antes:** `node scripts/probar-produccion.js` → **25/25**. Además de comprobar, despierta los servidores de Render (si no, la primera página tarda ~30 s frente al docente).
- [ ] **Elastic Cloud vigente:** la prueba vence hacia el **24 de noviembre de 2026**. Si la exposición es después, avisar antes para buscar otra opción: sin Elastic no funciona el bloque del buscador.
- [ ] **Datos de demostración en producción** (los crea el superadmin desde el panel, antes del día):
  - un negocio de prueba con un alojamiento asignado y publicado, y sus datos de acceso a mano;
  - una reserva de prueba ya hecha, para que la bandeja no salga vacía.
- [ ] **Pestañas abiertas en este orden:** 1) diapositivas, 2) el sitio, 3) `/buscar`, 4) `/admin` como superadmin, 5) ventana de **incógnito** con `/admin` para entrar como el negocio, 6) GitHub → Actions, 7) una terminal en la carpeta del proyecto.
- [ ] Navegador limpio (sin marcadores personales), **zoom al 125 %** en el sitio para que se lea en el proyector, notificaciones del sistema apagadas.
- [ ] **Plan B:** las diapositivas descargadas en PDF en el computador, por si no hay internet.
- [ ] **Ensayo completo cronometrado** al menos una vez, con los cambios de turno.

## Reparto

| Diap. | Tiempo | Quién | Bloque |
|---|---|---|---|
| 1–4 | 0:00 – 1:50 | Sebastián | Presentación, problema, objetivos y Scrum |
| 5–6 | 1:50 – 3:20 | Sebastián | Arquitectura y decisiones |
| 7–8 | 3:20 – 5:20 | Halit | Demo del turista (en vivo) |
| 9 | 5:20 – 6:35 | Jaime | Buscador con Elasticsearch y facets (en vivo) |
| 10–11 | 6:35 – 8:50 | Wilinton | Roles de negocio y reservas (en vivo) |
| 12–14 | 8:50 – 10:35 | Jaime | Seguridad, despliegue y pruebas |
| 15–16 | 10:35 – 11:20 | Sebastián y los cuatro | Rúbrica, aprendizajes y preguntas |

> Si el docente da exactamente 10 minutos: recortar la diapositiva 4 a una frase, saltar los opcionales de Wilinton y no correr la prueba en vivo (mostrar la diapositiva 14).

---

### Bloque 1 · Sebastián · diapositivas 1–4 (1:50)

- **Diap. 1 (portada):** "Somos Sebastián, Halit, Jaime y Wilinton. Les presentamos Sucre Turístico: una plataforma que reúne destinos, alojamiento, gastronomía, experiencias y eventos del Golfo de Morrosquillo, donde cada hotel o restaurante publica y maneja su propia información."
- **Diap. 2 (problema):** "La región tiene más de 1.378 prestadores registrados y crece cerca de un 9 % al año, pero la información está regada en redes y páginas sueltas. El turista no puede buscar ni comparar, y el negocio no tiene dónde actualizar lo suyo ni cómo recibir una reserva."
- **Diap. 3 (objetivos):** no leer las tarjetas. "Planteamos ocho objetivos y los ocho están cumplidos; cada compañero les va a mostrar la evidencia de los suyos. Y fuimos más allá del plan: cuentas para cada negocio y reservas."
- **Diap. 4 (Scrum):** "Trabajamos con Scrum en cuatro sprints; yo fui el Scrum Master. Nada entraba al código sin un Pull Request revisado por otro compañero y con las pruebas en verde."

**Paso:** "Ahora les muestro cómo está armado por dentro."

### Bloque 2 · Sebastián · diapositivas 5–6 (1:30)

- **Diap. 5 (arquitectura):** recorrer el diagrama de izquierda a derecha con el puntero. "El frontend en React está en Vercel y nunca habla directo con los servicios: todo entra por el API Gateway, que valida la sesión y el rol. Detrás hay seis microservicios en Node, cada uno con su Dockerfile, desplegados por separado en Render. Los cinco de catálogo usan MySQL en TiDB Cloud; el buscador usa Elasticsearch en Elastic Cloud."
- **Diap. 6 (decisiones):** "Tres decisiones explican esta forma: el login vive en el gateway y no en un séptimo servicio; los servicios solo aceptan escrituras que traen un secreto que solo conoce el gateway; y el buscador se llena leyendo las APIs, para que ningún servicio toque la base de otro."

**Paso:** "Halit les va a mostrar cómo se ve todo esto para el turista."

### Bloque 3 · Halit · diapositivas 7–8, en vivo (2:00)

Cambiar a la pestaña del sitio.

1. **Portada:** dejar que cambie de vista una vez. "Cambia sola entre playas, naturaleza, gastronomía y el próximo evento, con el clima real del municipio."
2. **Explorar → Gastronomía**, aplicar un filtro de municipio.
3. **Abrir un restaurante:** "Cada lugar tiene su página con la carta de platos típicos, el mapa, el clima y lugares cercanos." Tocar **Ver foto**.
4. **Corazón → Mis favoritos:** "Sin cuenta, el turista guarda lo que le interesa."
5. **Ctrl+K** y escribir "covenas": "Un buscador instantáneo que encuentra aunque no pongas tildes."
6. **F12 → vista de celular:** "En el celular aparece una barra inferior, como en una app."

Cerrar con: "Todo lo que ven sale de la API, no hay datos quemados. Usamos Bootstrap como base y le sumamos librerías como Swiper, Leaflet y motion."

**Si falla internet:** diapositivas 7 y 8 con las capturas.

**Paso:** "Jaime les explica qué hay detrás de ese buscador."

### Bloque 4 · Jaime · diapositiva 9, en vivo (1:15)

Pestaña `/buscar`.

1. Buscar **"playa"**: "Busca en los cinco catálogos a la vez; hoy da 17 resultados en menos de medio segundo."
2. Señalar los **facets** con sus números; elegir **Municipio: Coveñas** y luego un **rango de precio**. "Los conteos se recalculan con cada filtro: cada facet se cuenta con todos los filtros menos el suyo, por eso puedo cambiar de municipio sin borrar nada."
3. Escribir **"rin"** despacio: aparece Rincón del Mar. "El índice usa un analizador en español que quita tildes y reduce las palabras a su raíz, y un campo *search-as-you-type* para las sugerencias. Está en Elastic Cloud y el panel lo actualiza solo cuando un negocio cambia algo."

**Paso:** "Ahora Wilinton les muestra el otro lado: el de los negocios."

### Bloque 5 · Wilinton · diapositivas 10–11, en vivo (2:15)

1. **Diap. 10 (roles):** "En la primera entrega había un solo administrador, pero el problema era que cada negocio manejara su información, así que lo dividimos: superadministrador y negocio."
   - En `/admin` como superadmin: **Negocios → Nueva cuenta de negocio** y mostrar los datos de acceso que genera. "La cuenta nace con una contraseña temporal que el negocio cambia al entrar."
2. **Diap. 11 (reservas):**
   - En el sitio, abrir el hotel del negocio de prueba → **Reservar estadía** → fechas, huéspedes, nombre y teléfono → "¡Solicitud enviada!". "El turista reserva sin crear cuenta. Es la única escritura pública, y el gateway la limita a cinco por IP cada quince minutos."
   - En la ventana de **incógnito**, entrar como el negocio: "Mi negocio solo muestra sus fichas." Abrir **Reservas pendientes**, mostrar el botón de **WhatsApp** y **Confirmar**.
3. **Opcionales** (si sobra tiempo): el interruptor **"En el sitio"** para ocultar y volver a publicar; **Suspender** la cuenta de prueba, recargar el sitio y mostrar que su hotel desaparece; luego **Reactivar**.

**Paso:** "Jaime cierra con cómo está desplegado y cómo sabemos que funciona."

### Bloque 6 · Jaime · diapositivas 12–14 (1:45)

- **Diap. 12 (seguridad):** elegir dos filas, no leer la tabla. "Aunque alguien conozca la dirección de un microservicio, no puede escribir saltándose el gateway, porque le falta el secreto. Y un negocio no puede tocar lo de otro, porque el servicio vuelve a revisar el dueño."
- **Diap. 13 (despliegue):** "Frontend en Vercel; gateway y seis servicios en Render, cada uno en Docker; MySQL en TiDB Cloud; Elasticsearch en Elastic Cloud. En cada Pull Request, GitHub Actions corre las pruebas y construye las imágenes; al unir a main, todo se despliega solo." Mostrar 5 s la pestaña **Actions** en verde.
- **Diap. 14 (pruebas):** si la red responde, correr en la terminal `node scripts/probar-produccion.js` (~15 s); si no, la diapositiva. "Setenta y nueve pruebas automáticas, y este script prueba producción de verdad: los catálogos, el buscador y la seguridad. Un POST sin token da 401 y uno directo a un microservicio da 403. Veinticinco de veinticinco."

**Paso:** "Sebastián cierra."

### Bloque 7 · Sebastián y los cuatro · diapositivas 15–16 (0:45)

- **Diap. 15 (rúbrica):** "Esta es la rúbrica y dónde vieron cada criterio. El de más peso, la integración, es lo que mostraron Halit y Wilinton funcionando en vivo."
- **Diap. 16 (cierre):** cada uno dice su aprendizaje en una frase, en el orden de las tarjetas, sin leerla. Sebastián: "Gracias. El sitio y el código están en estos enlaces. Quedamos atentos a sus preguntas."

---

## Preguntas que pueden hacer

Responde quien presentó esa parte. Respuestas cortas: una o dos frases y, si se puede, mostrar algo.

| Pregunta | Responde | Idea de respuesta |
|---|---|---|
| ¿Por qué no hay un servicio de autenticación aparte? | Sebastián | El enunciado fija seis microservicios y centralizar el login es la función del gateway; los servicios no necesitan saber de usuarios. |
| ¿Por qué todos los servicios usan la misma base de datos? | Sebastián | Por el plan gratuito de TiDB comparten la instancia, pero cada servicio solo toca sus tablas; separarlas sería cambiar la conexión, no el código. |
| ¿Qué pasa si se cae un microservicio? | Sebastián | Se cae solo esa sección; el resto del sitio sigue funcionando y el frontend muestra un mensaje de error en esa lista. |
| ¿Cómo manejan los errores en el frontend? | Halit | Cada lista tiene estado de carga, vacío y error; si un servidor tarda, aparece un aviso; los formularios muestran el mensaje de la API. |
| ¿Por qué Bootstrap y no otra librería? | Halit | Es la base que conocía todo el equipo; le sumamos librerías puntuales (Swiper, Leaflet, motion, cmdk) para el acabado, sin reescribir. |
| ¿Qué pasa si alguien llama directo a un microservicio? | Jaime | Las escrituras sin el secreto del gateway reciben 403; lo comprueba `probar-produccion.js` en los seis servicios. |
| ¿Por qué el buscador no lee la base de datos? | Jaime | Cada servicio es dueño de sus datos; el buscador los toma de sus APIs públicas, igual que cualquier cliente. |
| ¿Cómo se calculan los facets? | Jaime | Agregaciones de Elasticsearch con `post_filter`: cada facet se cuenta con todos los filtros menos el suyo. |
| ¿Por qué tarda la primera carga? | Jaime | El plan gratuito de Render duerme los servicios tras un rato sin uso; el sitio avisa mientras despiertan. |
| ¿Cómo evitan que un negocio edite lo de otro? | Wilinton | Doble capa: el gateway exige sesión y cuenta activa en cada escritura; el servicio compara el dueño de la ficha con la cuenta. |
| ¿Qué pasa con las fichas de una cuenta suspendida? | Wilinton | Desaparecen del sitio y del buscador; al reactivarla vuelven. |
| ¿Por qué no hay pagos en línea? | Wilinton | Quedó fuera de alcance: la reserva es una solicitud que el negocio confirma por WhatsApp; los pagos son trabajo futuro. |

## Después de exponer

- Borrar desde el panel la cuenta y la reserva de prueba si no se van a usar más.
