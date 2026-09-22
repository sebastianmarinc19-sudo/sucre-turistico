-- Catalogo de municipios del departamento de Sucre.
--
-- ESTA TABLA ES COMPARTIDA POR LOS 5 SERVICIOS CON BASE DE DATOS.
-- Todas las entidades del catalogo (destinos, alojamientos, restaurantes,
-- experiencias, eventos) apuntan aqui con `municipio_id`.
--
-- ¿Por que una tabla y no un VARCHAR en cada entidad? Porque los facets del
-- criterio 3 agrupan por municipio: si Halit escribe 'Tolu' y Jaime escribe
-- 'Tolú', el buscador los cuenta como dos municipios distintos y el filtro
-- queda roto. Con una llave foranea eso no puede pasar.
--
-- Son los 26 municipios oficiales de Sucre. Si falta alguno o hay una tilde
-- mal puesta, corrijanlo aqui y en ningun otro lado.

CREATE TABLE IF NOT EXISTS municipios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  subregion ENUM('morrosquillo', 'montes_de_maria', 'sabanas', 'san_jorge', 'mojana') NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- INSERT IGNORE: si la tabla ya tiene los municipios, no falla ni los duplica.
INSERT IGNORE INTO municipios (nombre, subregion) VALUES
  ('Sincelejo',            'sabanas'),
  ('Buenavista',           'sabanas'),
  ('Caimito',              'san_jorge'),
  ('Chalán',               'montes_de_maria'),
  ('Colosó',               'montes_de_maria'),
  ('Corozal',              'sabanas'),
  ('Coveñas',              'morrosquillo'),
  ('El Roble',             'sabanas'),
  ('Galeras',              'sabanas'),
  ('Guaranda',             'mojana'),
  ('La Unión',             'san_jorge'),
  ('Los Palmitos',         'montes_de_maria'),
  ('Majagual',             'mojana'),
  ('Morroa',               'montes_de_maria'),
  ('Ovejas',               'montes_de_maria'),
  ('Palmito',              'morrosquillo'),
  ('Sampués',              'sabanas'),
  ('San Benito Abad',      'san_jorge'),
  ('San Juan de Betulia',  'sabanas'),
  ('San Marcos',           'san_jorge'),
  ('San Onofre',           'morrosquillo'),
  ('San Pedro',            'sabanas'),
  ('Sincé',                'sabanas'),
  ('Sucre',                'mojana'),
  ('Santiago de Tolú',     'morrosquillo'),
  ('Toluviejo',            'morrosquillo');
