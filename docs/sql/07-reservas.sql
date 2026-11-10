-- Fuerza UTF-8 en esta sesion de importacion (ver 04-datos-ejemplo.sql).
SET NAMES utf8mb4;

-- Reservaciones: el turista pide una reserva desde la ficha de un alojamiento,
-- un restaurante o una experiencia, sin crear cuenta. El dueno de la ficha
-- (o el superadmin) la ve en la bandeja "Reservas" de su panel, contacta al
-- cliente y la confirma o la rechaza.
--
-- Una sola tabla para las tres secciones: cada microservicio solo lee y
-- escribe las filas de la suya (columna `seccion`), y sabe de quien es cada
-- reserva por el propietario_id de su ficha.
--
-- Campos segun la seccion:
--   alojamiento  fecha_inicio = llegada, fecha_fin = salida (obligatoria)
--   restaurante  fecha_inicio = el dia, hora (obligatoria)
--   experiencia  fecha_inicio = el dia
--
-- CREATE TABLE IF NOT EXISTS: se puede aplicar varias veces.

CREATE TABLE IF NOT EXISTS reservas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  seccion ENUM('alojamiento', 'restaurante', 'experiencia') NOT NULL,
  ficha_id INT NOT NULL,
  nombre_cliente VARCHAR(120) NOT NULL,
  telefono VARCHAR(30) NOT NULL,
  email VARCHAR(180),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  hora TIME,
  personas SMALLINT NOT NULL,
  mensaje TEXT,
  estado ENUM('pendiente', 'confirmada', 'rechazada') NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_reservas_ficha (seccion, ficha_id),
  INDEX idx_reservas_estado (estado)
) DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
