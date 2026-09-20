-- Tabla de usuarios del panel de administracion.
--
-- Guarda SOLO administradores. El turista no tiene cuenta: accede directo a
-- toda la informacion del catalogo sin registrarse ni iniciar sesion, que es
-- lo que describe el enunciado. Por eso aqui no hay columna `rol`: no hay
-- nada que distinguir, todo el que esta en esta tabla es administrador.
--
-- docker-compose monta esta carpeta en /docker-entrypoint-initdb.d, asi que
-- MySQL ejecuta este archivo solo la PRIMERA vez que se crea el volumen. Si ya
-- levantaste la base antes y quieres aplicarlo, corre:
--   docker compose down -v && npm run up
-- (ojo: -v borra los datos locales).
--
-- En produccion (TiDB) hay que ejecutarlo a mano una vez.

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- No se inserta ningun usuario a proposito: la primera cuenta se crea desde la
-- API con POST /api/auth/registro (ver docs/AUTENTICACION.md). Asi no queda una
-- contrasena de ejemplo escrita en el repositorio.
