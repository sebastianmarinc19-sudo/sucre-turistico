# Autenticación y rol de administrador

El enunciado define dos tipos de usuario: **turista** (consulta) y **administrador** (registra y gestiona contenido). Esto es lo que implementa esa distinción.

## Dónde vive y por qué

La autenticación está en el **API Gateway**, no en un microservicio aparte.

El enunciado fija seis microservicios definitivos; agregar un séptimo `auth-service` se desviaría de eso. Además, centralizar autenticación es la función de libro de un API Gateway: un solo punto valida el token y el resto de servicios no tienen que saber nada de usuarios. Es la respuesta corta si en la sustentación preguntan por qué no hay un servicio de auth.

## El modelo de permisos

| Quién | Qué puede hacer |
|---|---|
| Cualquiera, sin cuenta | `GET` a todos los servicios: ver destinos, hoteles, restaurantes, eventos, buscar |
| Administrador con token | Todo lo anterior + `POST`, `PUT`, `DELETE` (crear, editar y borrar contenido) |

La regla vive en [`api-gateway/src/auth/middleware.js`](../api-gateway/src/auth/middleware.js): los métodos de lectura pasan directo, los de escritura exigen un token con `rol: "admin"`.

Esto además cierra un agujero real: los microservicios están públicos en Render, así que sin esta capa cualquiera en internet podría escribir en la base de datos en cuanto existieran los endpoints de escritura.

## Endpoints

| Método y ruta | Quién | Qué hace |
|---|---|---|
| `POST /api/auth/registro` | nadie logueado, **solo si no hay usuarios** · después, un admin | Crea una cuenta de administrador |
| `POST /api/auth/login` | cualquiera | Devuelve `{ token, usuario }` |
| `GET /api/auth/yo` | admin | Devuelve los datos del token (útil para el front) |

El token es un JWT que dura **8 horas**.

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

El flujo que hay que construir en React:

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
