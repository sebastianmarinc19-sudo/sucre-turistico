# Correr el proyecto en tu máquina

Hay **dos formas** de levantar el proyecto. Cuál te sirve depende de la RAM que tengas.

## Primero: ¿cuánta RAM tiene tu equipo?

En Windows, abre PowerShell y corre:

```powershell
(Get-CimInstance Win32_OperatingSystem).TotalVisibleMemorySize / 1MB
```

| Tu RAM | Usa la ruta |
|---|---|
| 12 GB o más | **A — Docker completo** |
| 8 GB | A, pero cierra Chrome y todo lo pesado. Si se cae, pásate a B |
| 6 GB o menos | **B — ligera, sin Docker** |

Esto no es un capricho: el `docker-compose.yml` completo pide alrededor de **4.3 GB**, y Elasticsearch solo se lleva 1.5 GB de eso. En un equipo de 6 GB, Docker Desktop se queda sin memoria, mata a MySQL y se cierra solo. Ya nos pasó, está documentado abajo en Problemas conocidos.

---

## Ruta A — Docker completo

Requisitos: **Node.js 20.19+ o 22+**, **Docker Desktop**, **Git**.

```bash
git clone https://github.com/sebastianmarinc19-sudo/sucre-turistico.git
cd sucre-turistico
git checkout develop

npm install
npm run setup
npm run up
```

La primera vez tarda entre 10 y 15 minutos: descarga MySQL y Elasticsearch y construye 8 imágenes. Las siguientes son segundos.

Cuando termine:

- API Gateway: http://localhost:4000/health
- Front-end: http://localhost:3000
- Microservicios: http://localhost:4001 a 4006, cada uno con `/health`

Para bajar todo: `npm run down`. Para ver logs: `npm run logs`.

---

## Ruta B — Ligera, sin Docker

Corre los servicios directamente con Node. Consume **625 MB** en vez de 4.3 GB (medido, con los 6 servicios arriba).

Requisitos: **Node.js 20.19+ o 22+** y **Git**. Docker solo lo vas a necesitar para MySQL, y únicamente cuando empieces a trabajar con la base de datos.

### Preparar

```bash
git clone https://github.com/sebastianmarinc19-sudo/sucre-turistico.git
cd sucre-turistico
git checkout develop

npm install
npm run setup
```

### Levantar los servicios

Cada servicio va en **su propia terminal**, así ves sus logs por separado:

```bash
cd services/destinos-service && npm start
```

```bash
cd api-gateway && npm start
```

No necesitas levantar los 6 microservicios. Si estás trabajando en `destinos-service`, con ese y el gateway te alcanza.

Cada servicio lee su propio archivo `.env` (el que creó `npm run setup`), así que los puertos salen bien solos: destinos en 4001, alojamiento en 4002, gastronomía en 4003, experiencias en 4004, eventos en 4005, buscador en 4006 y el gateway en 4000.

Verifica que responde:

```bash
curl http://localhost:4000/health
```

### El front-end

```bash
cd frontend && npm run dev
```

Queda en http://localhost:3000.

### MySQL para la ruta B

Cuando llegues al CRUD vas a necesitar la base de datos. Solo MySQL en Docker pesa ~400 MB, eso sí entra en un equipo de 6 GB:

```bash
docker compose up -d mysql
```

Eso levanta **únicamente** el contenedor de MySQL, sin Elasticsearch ni nada más. Para bajarlo: `docker compose stop mysql`.

Si prefieres no usar Docker para nada, instala MySQL 8 nativo para Windows y crea la base `sucre_turistico`. Los datos de conexión que esperan los servicios están en cada `.env` (usuario `root`, contraseña `root`, puerto 3306).

### Limitarle la memoria a WSL (recomendado si tienes 8 GB o menos)

Sin límite, WSL2 crece hasta ahogar Windows. Crea el archivo `C:\Users\TU_USUARIO\.wslconfig` con:

```ini
[wsl2]
memory=2560MB
processors=2
swap=2GB
```

Luego corre `wsl --shutdown` para que tome efecto.

---

## Problemas conocidos

Todos estos nos pasaron de verdad montando el proyecto.

**`docker: command not found` justo después de instalar Docker Desktop.**
La terminal que ya tenías abierta no tiene el PATH nuevo. Ciérrala y abre una nueva.

**Docker Desktop instalado pero `error during connect` / `cannot find the file specified`.**
El motor no está corriendo. Abre Docker Desktop desde el menú de inicio y espera a que el ícono de la ballena deje de moverse. No se puede arrancar desde la terminal.

**`unexpected EOF` descargando Elasticsearch.**
Su registro (`docker.elastic.co`) es lento e inestable. Docker guarda las capas que alcanzó a bajar, así que reintentar retoma donde quedó. Si insiste en fallar, sáltate Elasticsearch: `buscador-service` no lo usa hasta el Sprint 2.

**MySQL sale con código 255 y Docker Desktop se cierra solo.**
Es falta de memoria. Pásate a la ruta B.

**`EADDRINUSE` o un puerto ocupado.**
Quedó un proceso vivo de un arranque anterior:

```bash
npx kill-port 4000 4001 4002 4003 4004 4005 4006
```

**El gateway no arranca y dice que falta `JWT_SECRET`.**
No corriste `npm run setup`, o lo corriste antes de actualizar el repo. Bórrate los `.env` y vuelve a generarlos:

```bash
rm api-gateway/.env services/*/.env && npm run setup
```

**Los puertos salen todos en 4000 y chocan entre sí.**
Tus `.env` son de una versión vieja del repo. Mismo arreglo del punto anterior: bórralos y regenéralos. `npm run setup` **no** pisa los `.env` que ya existen.

**El front-end no compila y habla de versiones de Node.**
Vite 8 necesita Node 20.19+ o 22+. Con `node -v` revisa cuál tienes; si es 18 o menor, actualiza.
