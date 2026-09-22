-- Datos de ejemplo para desarrollo y para la demo.
--
-- Sirven para tres cosas:
--   1. Que la pagina de Destinos muestre algo desde el primer dia, en vez de
--      una lista vacia que no se distingue de un bug.
--   2. Que los facets tengan varios municipios y varias categorias que agrupar
--      (con una sola fila no se nota si funcionan).
--   3. Que todos probemos contra los mismos datos y los errores se reproduzcan.
--
-- OJO CON ESTO ANTES DE ENTREGAR:
-- Los destinos y los eventos son reales. Los alojamientos, restaurantes y
-- experiencias son INVENTADOS a proposito: no queremos publicar precios ni
-- telefonos falsos de negocios que existen de verdad. Antes de la entrega,
-- revisen los textos y reemplacen lo que quieran por informacion verificada.
--
-- El `municipio_id` se busca por nombre en vez de escribir el numero, para que
-- estas filas no se rompan si algun dia cambia el orden de 02-municipios.sql.
--
-- ESTE ARCHIVO NO ES IDEMPOTENTE: asume que las tablas estan vacias. Si lo
-- corres dos veces te quedan las filas duplicadas (no hay UNIQUE en `nombre`
-- porque dos municipios si pueden tener un hotel que se llame igual). En local
-- se limpia con `docker compose down -v`; en TiDB, borrando a mano.

-- ---------------------------------------------------------------------------
-- DESTINOS
-- ---------------------------------------------------------------------------
INSERT INTO destinos (nombre, municipio_id, categoria, descripcion) VALUES
  ('Playa de Coveñas',
   (SELECT id FROM municipios WHERE nombre = 'Coveñas'),
   'playa',
   'Playa sobre el Golfo de Morrosquillo, una de las mas visitadas del departamento.'),

  ('Playa de Tolú',
   (SELECT id FROM municipios WHERE nombre = 'Santiago de Tolú'),
   'playa',
   'Malecon y playa en el casco urbano, punto de partida de los paseos en lancha.'),

  ('Ciénaga de La Caimanera',
   (SELECT id FROM municipios WHERE nombre = 'Coveñas'),
   'atractivo_natural',
   'Manglar con recorridos guiados en canoa entre tuneles de vegetacion.'),

  ('Taller de hamacas de Morroa',
   (SELECT id FROM municipios WHERE nombre = 'Morroa'),
   'atractivo_cultural',
   'Tradicion artesanal del tejido de hamacas en telar, reconocida en la region.'),

  ('Centro histórico de Sincelejo',
   (SELECT id FROM municipios WHERE nombre = 'Sincelejo'),
   'lugar_turistico',
   'Catedral de San Francisco de Asis, parque Santander y el centro de la capital.'),

  ('Golfo de Morrosquillo desde San Onofre',
   (SELECT id FROM municipios WHERE nombre = 'San Onofre'),
   'playa',
   'Sector de playas y corregimientos costeros al norte del golfo.');

-- ---------------------------------------------------------------------------
-- ALOJAMIENTOS  (ejemplos inventados)
-- ---------------------------------------------------------------------------
INSERT INTO alojamientos (nombre, municipio_id, tipo, descripcion, precio_noche, capacidad, estrellas, servicios) VALUES
  ('Hotel Brisas del Golfo',
   (SELECT id FROM municipios WHERE nombre = 'Coveñas'),
   'hotel', 'Frente al mar, con piscina y restaurante.',
   280000.00, 4, 3, '["wifi", "piscina", "aire_acondicionado", "parqueadero"]'),

  ('Posada Manglar',
   (SELECT id FROM municipios WHERE nombre = 'Santiago de Tolú'),
   'posada', 'Posada familiar a dos cuadras del malecon.',
   120000.00, 3, 2, '["wifi", "ventilador"]'),

  ('Hostal Sabanero',
   (SELECT id FROM municipios WHERE nombre = 'Sincelejo'),
   'hostal', 'Opcion economica en el centro, ideal para viaje corto.',
   65000.00, 2, 1, '["wifi"]'),

  ('Cabañas El Ceibal',
   (SELECT id FROM municipios WHERE nombre = 'San Onofre'),
   'cabana', 'Cabanas independientes con cocina, a 10 minutos de la playa.',
   190000.00, 6, 2, '["cocina", "parqueadero", "aire_acondicionado"]');

-- ---------------------------------------------------------------------------
-- RESTAURANTES Y PLATOS  (ejemplos inventados)
-- ---------------------------------------------------------------------------
INSERT INTO restaurantes (nombre, municipio_id, tipo_cocina, descripcion, rango_precio) VALUES
  ('Sabor de Morrosquillo',
   (SELECT id FROM municipios WHERE nombre = 'Coveñas'),
   'mariscos', 'Pescado fresco del dia a la orilla de la playa.', 'medio'),

  ('La Sabana',
   (SELECT id FROM municipios WHERE nombre = 'Sincelejo'),
   'tipica', 'Cocina sucrena tradicional, almuerzo corriente y a la carta.', 'economico'),

  ('Mote y Queso',
   (SELECT id FROM municipios WHERE nombre = 'Corozal'),
   'tipica', 'Especializado en platos tradicionales de las sabanas.', 'economico');

INSERT INTO platos (restaurante_id, nombre, descripcion, precio, es_tipico) VALUES
  ((SELECT id FROM restaurantes WHERE nombre = 'Sabor de Morrosquillo'),
   'Mojarra frita con patacón', 'Mojarra entera con patacon, arroz de coco y ensalada.', 38000.00, TRUE),
  ((SELECT id FROM restaurantes WHERE nombre = 'Sabor de Morrosquillo'),
   'Arroz de camarón', 'Arroz con camaron y verduras.', 42000.00, TRUE),
  ((SELECT id FROM restaurantes WHERE nombre = 'La Sabana'),
   'Sancocho de gallina criolla', 'Sancocho servido con arroz, aguacate y suero.', 25000.00, TRUE),
  ((SELECT id FROM restaurantes WHERE nombre = 'Mote y Queso'),
   'Mote de queso', 'Sopa de name con queso costeno, plato insignia de la region.', 18000.00, TRUE);

-- ---------------------------------------------------------------------------
-- EXPERIENCIAS  (ejemplos inventados)
-- ---------------------------------------------------------------------------
INSERT INTO experiencias (nombre, municipio_id, tipo, descripcion, precio, duracion_horas, operador) VALUES
  ('Paseo en lancha por el Golfo',
   (SELECT id FROM municipios WHERE nombre = 'Santiago de Tolú'),
   'acuatica', 'Recorrido en lancha con parada para banarse.', 95000.00, 6.0, 'Operador de ejemplo'),

  ('Recorrido en canoa por el manglar',
   (SELECT id FROM municipios WHERE nombre = 'Coveñas'),
   'ecoturismo', 'Navegacion guiada por los tuneles de mangle de La Caimanera.', 45000.00, 2.0, 'Operador de ejemplo'),

  ('Taller de tejido en telar',
   (SELECT id FROM municipios WHERE nombre = 'Morroa'),
   'cultural', 'Taller practico con artesanos locales.', 30000.00, 3.0, 'Operador de ejemplo'),

  ('Ruta gastronómica sabanera',
   (SELECT id FROM municipios WHERE nombre = 'Sincelejo'),
   'gastronomica', 'Recorrido por puestos y restaurantes de comida tipica.', 60000.00, 4.0, 'Operador de ejemplo');

-- ---------------------------------------------------------------------------
-- EVENTOS
-- Las fechas son las tipicas de cada festividad; ajustenlas al ano en curso.
-- ---------------------------------------------------------------------------
INSERT INTO eventos (nombre, municipio_id, tipo, descripcion, fecha_inicio, fecha_fin, lugar, precio_entrada) VALUES
  ('Festival Nacional de Gaitas',
   (SELECT id FROM municipios WHERE nombre = 'Ovejas'),
   'festival', 'Encuentro de gaiteros y musica tradicional de los Montes de Maria.',
   '2026-08-14', '2026-08-17', 'Plaza principal de Ovejas', NULL),

  ('Fiestas del 20 de Enero',
   (SELECT id FROM municipios WHERE nombre = 'Sincelejo'),
   'feria', 'Fiestas tradicionales de Sincelejo, con programacion cultural y desfiles.',
   '2027-01-15', '2027-01-25', 'Sincelejo', NULL),

  ('Semana Santa en Corozal',
   (SELECT id FROM municipios WHERE nombre = 'Corozal'),
   'religioso', 'Procesiones y actos religiosos de la Semana Mayor.',
   '2027-03-22', '2027-03-28', 'Corozal', NULL),

  ('Festival del Mote de Queso',
   (SELECT id FROM municipios WHERE nombre = 'San Juan de Betulia'),
   'cultural', 'Celebracion alrededor del plato tipico de las sabanas.',
   '2026-11-07', '2026-11-08', 'San Juan de Betulia', NULL);
