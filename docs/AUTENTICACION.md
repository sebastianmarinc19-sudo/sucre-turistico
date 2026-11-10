# Autenticación del administrador

El enunciado define dos tipos de usuario: **turista** (consulta) y **administrador** (registra y gestiona contenido). Esto es lo que implementa esa distinción.

## Dónde vive y por qué

La autenticación está en el **API Gateway**, no en un microservicio aparte.

El enunciado fija seis microservicios definitivos; agregar un séptimo `auth-service` se desviaría de eso. Además, centralizar autenticación es la función de libro de un API Gateway: un solo punto valida el token y el resto de servicios no tienen que saber nada de usuarios. Es la respuesta corta si en la sustentación preguntan por qué no hay un servicio de auth.

## El modelo de permisos

| Quién | Qué puede hacer |
|---|---|
| **Turista** — cualquiera, sin cuenta | `GET` a todos los servicios: ver destinos, hoteles, restaurantes, eventos, buscar. Solo ve fichas **publicadas** de cuentas **activas**. |
| **Negocio** — hotel, restaurante u operador, con cuenta que le crea el superadmin | Maneja **solo sus fichas** de alojamiento, restaurante (con su carta de platos), experiencias y eventos: crearlas (quedan a su nombre), editarlas, borrarlas y **publicarlas u ocultarlas**. No toca destinos ni lo de otros negocios. |
| **Superadministrador** — la primera cuenta | Todo: los destinos, cualquier ficha, asignarle dueño a una ficha, y las cuentas de los negocios (crear, suspender, reactivar, restablecer la contraseña). |

Los roles llegaron con [`docs/sql/06-roles-negocios.sql`](sql/06-roles-negocios.sql): `usuarios.rol`, `usuarios.activo`, `usuarios.debe_cambiar_password`, y en cada ficha `propietario_id` y `publicado`.

**Cómo se hace cumplir, en dos capas:**

1. **El gateway** ([`middleware.js`](../api-gateway/src/auth/middleware.js)): las lecturas pasan (si traen token, se identifica a quien pregunta); las escrituras exigen sesión, se revisa la cuenta **en la base en cada escritura** (una cuenta suspendida queda bloqueada al instante aunque su token siga vigente) y los destinos solo los escribe el superadmin. Al reenviar, el gateway agrega `X-Usuario-Id` y `X-Usuario-Rol`, después de borrar las que mande el cliente.
2. **Cada microservicio** (`src/propiedad.js`, igual en los cuatro con dueño): solo cree en esas cabeceras si además llega `X-Gateway-Secret`. Un negocio solo modifica las fichas cuyo `propietario_id` es su cuenta; lo que crea queda a su nombre aunque el formulario diga otra cosa. Con `?panel=1` (lo manda el panel) el superadmin ve todo y el negocio lo suyo, publicado o no; sin eso se ve lo mismo que el turista.

**Suspender una cuenta** la bloquea y además oculta todas sus fichas del sitio (y del buscador, al reindexar). Al reactivarla, vuelven.

**Contraseñas temporales:** el superadmin crea la cuenta del negocio con una contraseña temporal y se la pasa; el panel no deja hacer nada hasta que el negocio la cambie por una propia. Lo mismo al restablecerla.

## Endpoints

| Método y ruta | Quién | Qué hace |
|---|---|---|
| `POST /api/auth/registro` | nadie logueado, **solo si no hay usuarios** (y esa cuenta es superadmin) · después, solo el superadmin | Crea una cuenta; por defecto de negocio, con contraseña temporal |
| `POST /api/auth/login` | cualquiera | Devuelve `{ token, usuario }`. Una cuenta suspendida recibe 403 |
| `GET /api/auth/yo` | cualquier sesión | Datos de la cuenta, leídos de la base |
| `POST /api/auth/cambiar-password` | cualquier sesión | `{ actual, nueva }`; quita la marca de contraseña temporal |
| `GET /api/auth/usuarios` | superadmin | Lista las cuentas |
| `PATCH /api/auth/usuarios/:id` | superadmin | `{ activo }`: suspender o reactivar (no la propia) |
| `POST /api/auth/usuarios/:id/restablecer` | superadmin | `{ password }`: nueva contraseña temporal |

Además, en los servicios con dueño: `PATCH /api/<sección>/:id/publicado { publicado }`, y en gastronomía la carta: `POST /api/gastronomia/:id/platos`, `PUT` y `DELETE /api/gastronomia/:id/platos/:platoId`.

### Reservaciones ([`docs/sql/07-reservas.sql`](sql/07-reservas.sql))

El turista pide una reserva desde la ficha de un alojamiento, restaurante o experiencia **sin crear cuenta**: es la **única escritura pública** del sistema. El gateway la deja pasar sin token, con un límite de **5 solicitudes por IP cada 15 minutos**; el microservicio valida los datos (llegada y salida, hora del restaurante, fecha no pasada, teléfono, personas) y solo acepta fichas publicadas de cuentas activas.

| Método y ruta | Quién | Qué hace |
|---|---|---|
| `POST /api/{alojamientos,gastronomia,experiencias}/:id/reservas` | cualquiera, sin token | Crea la solicitud (estado `pendiente`) |
| `GET /api/{…}/reservas?estado=` | superadmin: todas · negocio: las de sus fichas | Bandeja "Reservas" del panel |
| `PATCH /api/{…}/reservas/:reservaId` | el mismo permiso | `{ estado }`: `confirmada`, `rechazada` o `pendiente` |

Los datos del turista (nombre y teléfono) solo los ve el dueño de la ficha y el superadmin. La lógica está en `src/reservas.js`, igual en los tres servicios.

El token es un JWT que dura **8 horas** y lleva el rol. Los tokens de antes de los roles (sin `rol`) ya no sirven: hay que volver a iniciar sesión.

## Crear el primer administrador

Es el problema del huevo y la gallina: si solo un admin puede crear cuentas, ¿quién crea la primera? La solución es que **mientras la tabla `usuarios` esté vacía, el primer registro se acepta sin token y queda como admin**. A partir de ahí, crear cuentas exige un token de administrador.

Con todo levantado (`npm run up`):

```bash
curl -X POST http://localhost:4000/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Sebastian","email":"admin@sucreturistico.co","password":"cambiala-por-una-real"}'
```

Luego, para obtener un token:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sucreturistico.co","password":"cambiala-por-una-real"}'
```

Y para usarlo en una escritura:

```bash
curl -X POST http://localhost:4000/api/destinos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <pega-el-token-aqui>" \
  -d '{"nombre":"Playa Coveñas","municipio":"Coveñas","categoria":"playa"}'
```

Sin el header `Authorization` esa misma petición responde `401`.

## La tabla `usuarios`

Está en [`docs/sql/01-usuarios.sql`](sql/01-usuarios.sql). En local, MySQL la crea sola: docker-compose monta esa carpeta en `/docker-entrypoint-initdb.d`, que MySQL ejecuta **solo al crear el volumen por primera vez**.

Si ya habías levantado la base antes de este cambio, la tabla no existe todavía. Para aplicarla:

```bash
docker compose down -v && npm run up
```

O, si estás en la ruta ligera de [`DESARROLLO_LOCAL.md`](DESARROLLO_LOCAL.md) (equipos de 6 GB o menos):

```bash
docker compose down -v && docker compose up -d mysql
```

Ojo: `-v` borra los datos locales de MySQL. Es tu base de desarrollo, no pasa nada, pero perderás los destinos de prueba que hayas insertado.

## Desde el front-end

Ya está implementado en el panel de administración (`/admin`, ver [`frontend/README.md`](../frontend/README.md)). Así funciona:

1. Pantalla de login que hace `POST /api/auth/login`.
2. Guardar el `token` (en `localStorage` está bien para este proyecto).
3. Configurar Axios para mandarlo en cada petición:
   ```js
   axios.interceptors.request.use((config) => {
     const token = localStorage.getItem('token');
     if (token) config.headers.Authorization = `Bearer ${token}`;
     return config;
   });
   ```
4. Si una respuesta vuelve `401`, borrar el token y mandar al login (el token expiró).
5. Las páginas públicas no necesitan nada de esto: siguen funcionando sin cuenta.

## Decisiones de seguridad (por si las preguntan)

- Las contraseñas se guardan con **bcrypt** (10 rondas), nunca en texto plano. En la base solo queda el hash.
- Login con email inexistente y login con clave incorrecta devuelven **el mismo mensaje**, para no revelar qué correos están registrados.
- El `JWT_SECRET` no está en el repositorio: viene por variable de entorno, y **no hay valor por defecto**. Sin él no se puede firmar ni verificar ningún token.
- **Si falta, el gateway arranca igual pero la autenticación queda deshabilitada.** El catálogo (todos los `GET`) sigue funcionando, y el login y las escrituras responden `503` explicando el motivo. Es una decisión deliberada: que el login esté mal configurado no debería dejar sin servicio a un turista que solo quiere consultar. No abre ningún hueco — sin secreto las escrituras siguen rechazadas, solo cambia el código de error.
- El gateway sigue sin usar `express.json()` de forma global — solo dentro de las rutas de auth — porque parsear el body rompería el reenvío de los POST hacia los microservicios.

## Pendiente para producción (Render)

- [ ] Definir `JWT_SECRET` en el servicio `sucre-turistico` de Render, con un valor distinto al de desarrollo. Generar uno con:
      `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- [ ] Enlazar el Environment Group `mysql-tidb` también al **api-gateway** (hoy solo está en los 5 microservicios), porque ahora el gateway consulta la tabla `usuarios`.
- [ ] Ejecutar `01-usuarios.sql` una vez contra TiDB.
- [ ] Crear el primer admin en producción con el mismo `POST /api/auth/registro`.
