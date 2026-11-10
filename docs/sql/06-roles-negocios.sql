-- Fuerza UTF-8 en esta sesion de importacion (ver 04-datos-ejemplo.sql).
SET NAMES utf8mb4;

-- Roles: superadministrador y cuentas de negocio.
--
-- Hasta aqui toda cuenta era administrador. Ahora hay dos roles:
--   superadmin  ve y edita todo, maneja los destinos y crea las cuentas de
--               los negocios (hoteles, restaurantes, operadores de tours).
--   negocio     solo ve y edita sus propias fichas (alojamientos,
--               restaurantes con su carta, experiencias y eventos), y decide
--               si estan publicadas.
--
-- Cada ficha guarda quien es su dueno (propietario_id). NULL = la maneja el
-- superadmin. `publicado` lo controla el dueno: una ficha oculta no aparece
-- en el sitio ni en el buscador, pero sigue en su panel. `activo` sigue
-- siendo el borrado suave del superadmin.
--
-- ESTA MIGRACION SE APLICA UNA SOLA VEZ: scripts/aplicar-esquema.js la salta
-- si `usuarios` ya tiene la columna `rol`. En una base nueva (docker-compose)
-- corre sola despues de 01-05.

-- Las cuentas que ya existen son el administrador de siempre: superadmin.
-- Por eso la columna nace con ese valor por defecto, y despues el defecto
-- pasa a ser el de menor privilegio.
ALTER TABLE usuarios ADD COLUMN rol ENUM('superadmin', 'negocio') NOT NULL DEFAULT 'superadmin';
ALTER TABLE usuarios ALTER COLUMN rol SET DEFAULT 'negocio';
-- Suspender una cuenta sin borrarla: no puede entrar y sus fichas se ocultan.
ALTER TABLE usuarios ADD COLUMN activo BOOLEAN NOT NULL DEFAULT TRUE;
-- La cuenta que crea el superadmin trae una contrasena temporal: al primer
-- ingreso hay que cambiarla.
ALTER TABLE usuarios ADD COLUMN debe_cambiar_password BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE alojamientos ADD COLUMN propietario_id INT NULL;
ALTER TABLE alojamientos ADD COLUMN publicado BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE alojamientos ADD INDEX idx_alojamientos_propietario (propietario_id);

ALTER TABLE restaurantes ADD COLUMN propietario_id INT NULL;
ALTER TABLE restaurantes ADD COLUMN publicado BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE restaurantes ADD INDEX idx_restaurantes_propietario (propietario_id);

ALTER TABLE experiencias ADD COLUMN propietario_id INT NULL;
ALTER TABLE experiencias ADD COLUMN publicado BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE experiencias ADD INDEX idx_experiencias_propietario (propietario_id);

ALTER TABLE eventos ADD COLUMN propietario_id INT NULL;
ALTER TABLE eventos ADD COLUMN publicado BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE eventos ADD INDEX idx_eventos_propietario (propietario_id);
