-- Esquema del catalogo turistico: las 5 entidades del negocio.
--
-- ============================================================================
-- LEAN ESTO ANTES DE ESCRIBIR SU CRUD
-- ============================================================================
--
-- Cada quien implementa su microservicio contra la tabla que le toco, pero las
-- cinco tablas comparten la misma forma a proposito. No es capricho de estilo:
-- el buscador (criterio 2) mete las cinco entidades en un mismo indice de
-- Elasticsearch, y los facets (criterio 3) agrupan por los mismos campos en
-- todas. Si cada tabla nombra sus columnas distinto, esa parte hay que
-- escribirla cinco veces en vez de una.
--
-- Columnas que TODAS las tablas tienen, con el mismo nombre y el mismo tipo:
--
--   id            INT AUTO_INCREMENT PRIMARY KEY
--   nombre        VARCHAR(150) NOT NULL       -- titulo que ve el turista
--   municipio_id  INT NOT NULL -> municipios(id)
--   descripcion   TEXT
--   imagen_url    VARCHAR(500)
--   activo        BOOLEAN NOT NULL DEFAULT TRUE
--   created_at    TIMESTAMP
--   updated_at    TIMESTAMP
--
-- Y cada tabla agrega ADEMAS una columna de clasificacion (`categoria` o
-- `tipo`) que es la que alimenta su facet propio.
--
-- Convenciones: tablas en plural y en espanol, columnas en snake_case, sin
-- tildes en los identificadores (solo en los datos).
--
-- ---------------------------------------------------------------------------
-- `activo` en vez de borrar de verdad
-- ---------------------------------------------------------------------------
-- El DELETE del CRUD debe hacer `UPDATE ... SET activo = FALSE`, no
-- `DELETE FROM`. Asi una equivocacion durante la demo se deshace con un UPDATE
-- y no se pierde nada. Los GET publicos filtran por `WHERE activo = TRUE`.
--
-- ---------------------------------------------------------------------------
-- Como se ve un registro para el buscador
-- ---------------------------------------------------------------------------
-- Cuando armemos `turismo_index`, cada fila de cualquiera de estas tablas se
-- convierte en un documento con esta forma. Por eso importa que los nombres
-- coincidan:
--
--   { id, tipo_entidad, nombre, descripcion, municipio, categoria, precio, imagen_url }
--
-- `tipo_entidad` lo pone el buscador ('destino', 'alojamiento', ...), no la
-- tabla. `precio` queda en NULL en las entidades que no cobran.
--
-- ============================================================================


-- ---------------------------------------------------------------------------
-- DESTINOS  (destinos-service)
-- Playas, atractivos naturales y culturales, lugares turisticos.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS destinos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  municipio_id INT NOT NULL,
  categoria ENUM('playa', 'atractivo_natural', 'atractivo_cultural', 'lugar_turistico') NOT NULL,
  descripcion TEXT,
  imagen_url VARCHAR(500),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_destinos_municipio FOREIGN KEY (municipio_id) REFERENCES municipios(id),
  INDEX idx_destinos_municipio (municipio_id),
  INDEX idx_destinos_categoria (categoria)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------------
-- ALOJAMIENTOS  (alojamiento-service)
-- Hoteles, hostales, posadas, cabanas, camping.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alojamientos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  municipio_id INT NOT NULL,
  tipo ENUM('hotel', 'hostal', 'posada', 'cabana', 'camping') NOT NULL,
  descripcion TEXT,
  imagen_url VARCHAR(500),
  -- Facet de precio: el buscador arma los rangos a partir de este numero.
  precio_noche DECIMAL(10, 2),
  capacidad INT,
  estrellas TINYINT,
  direccion VARCHAR(250),
  telefono VARCHAR(40),
  -- Lista para mostrar en la ficha, p.ej. ["wifi", "piscina", "aire"].
  -- No es un facet, es texto de apoyo: por eso va como JSON y no como tabla.
  servicios JSON,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_alojamientos_municipio FOREIGN KEY (municipio_id) REFERENCES municipios(id),
  INDEX idx_alojamientos_municipio (municipio_id),
  INDEX idx_alojamientos_tipo (tipo),
  INDEX idx_alojamientos_precio (precio_noche)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------------
-- RESTAURANTES  (gastronomia-service)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS restaurantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  municipio_id INT NOT NULL,
  tipo_cocina ENUM('tipica', 'mariscos', 'internacional', 'comida_rapida', 'vegetariana') NOT NULL,
  descripcion TEXT,
  imagen_url VARCHAR(500),
  rango_precio ENUM('economico', 'medio', 'alto'),
  direccion VARCHAR(250),
  telefono VARCHAR(40),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_restaurantes_municipio FOREIGN KEY (municipio_id) REFERENCES municipios(id),
  INDEX idx_restaurantes_municipio (municipio_id),
  INDEX idx_restaurantes_cocina (tipo_cocina)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Platos tipicos de cada restaurante (historia 7 del BACKLOG).
-- Es la unica relacion 1-a-muchos del esquema: sirve para mostrar un JOIN en
-- la sustentacion. El CRUD de platos es opcional si el tiempo aprieta.
CREATE TABLE IF NOT EXISTS platos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurante_id INT NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10, 2),
  es_tipico BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Si se borra el restaurante, sus platos se van con el: no tienen sentido solos.
  CONSTRAINT fk_platos_restaurante FOREIGN KEY (restaurante_id) REFERENCES restaurantes(id) ON DELETE CASCADE,
  INDEX idx_platos_restaurante (restaurante_id)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------------
-- EXPERIENCIAS  (experiencias-service)
-- Tours y actividades: acuaticas, culturales, ecoturismo, aventura.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS experiencias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  municipio_id INT NOT NULL,
  tipo ENUM('acuatica', 'cultural', 'ecoturismo', 'aventura', 'gastronomica') NOT NULL,
  descripcion TEXT,
  imagen_url VARCHAR(500),
  precio DECIMAL(10, 2),
  duracion_horas DECIMAL(4, 1),
  operador VARCHAR(150),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_experiencias_municipio FOREIGN KEY (municipio_id) REFERENCES municipios(id),
  INDEX idx_experiencias_municipio (municipio_id),
  INDEX idx_experiencias_tipo (tipo),
  INDEX idx_experiencias_precio (precio)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;


-- ---------------------------------------------------------------------------
-- EVENTOS  (eventos-service)
-- Festividades y agenda cultural.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eventos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  municipio_id INT NOT NULL,
  tipo ENUM('festival', 'feria', 'religioso', 'cultural', 'deportivo') NOT NULL,
  descripcion TEXT,
  imagen_url VARCHAR(500),
  -- La historia 11 pide consultar eventos POR FECHA: por eso fecha_inicio es
  -- obligatoria y esta indexada.
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  lugar VARCHAR(200),
  -- NULL significa entrada libre. 0 tambien, pero NULL lo dice mas claro.
  precio_entrada DECIMAL(10, 2),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_eventos_municipio FOREIGN KEY (municipio_id) REFERENCES municipios(id),
  INDEX idx_eventos_municipio (municipio_id),
  INDEX idx_eventos_tipo (tipo),
  INDEX idx_eventos_fecha (fecha_inicio)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
