-- Fuerza UTF-8 en esta sesion de importacion (ver 04-datos-ejemplo.sql).
SET NAMES utf8mb4;

-- Segunda tanda de datos de ejemplo, para que el catalogo no se vea vacio en
-- la demo y los filtros tengan varias opciones que mostrar.
--
-- A DIFERENCIA DE 04, ESTE ARCHIVO SI ES IDEMPOTENTE: cada fila se inserta
-- solo si todavia no existe otra con el mismo nombre, asi que se puede correr
-- varias veces (y sobre una base que ya tiene datos) sin duplicar nada.
--
-- Mismo criterio que 04: los destinos son lugares reales; los alojamientos,
-- restaurantes y experiencias son INVENTADOS, igual que los eventos marcados
-- como "(inventado)". Revisen los textos antes de la entrega.
--
-- Las filas se escriben como una tabla derivada (`n`) y el municipio se busca
-- por nombre con un JOIN, igual que en 04.

-- ---------------------------------------------------------------------------
-- DESTINOS
-- ---------------------------------------------------------------------------
INSERT INTO destinos (nombre, municipio_id, categoria, descripcion)
SELECT n.nombre, m.id, n.categoria, n.descripcion
FROM (
  SELECT 'Rincón del Mar' AS nombre, 'San Onofre' AS municipio, 'playa' AS categoria,
         'Pueblo de pescadores con playas tranquilas de arena clara y agua calmada, punto de salida hacia las islas cercanas.' AS descripcion
  UNION ALL SELECT 'Isla Boquerón', 'San Onofre', 'playa',
         'Pequeña isla frente a Rincón del Mar, rodeada de agua cristalina y arrecifes, a pocos minutos en lancha.'
  UNION ALL SELECT 'Playa de Berrugas', 'San Onofre', 'playa',
         'Playa amplia y poco concurrida, conocida por sus atardeceres sobre el golfo.'
  UNION ALL SELECT 'Primera Ensenada de Coveñas', 'Coveñas', 'playa',
         'Sector de playas con hoteles, kioscos de comida de mar y deportes náuticos.'
  UNION ALL SELECT 'Santuario de Fauna y Flora El Corchal', 'San Onofre', 'atractivo_natural',
         'Área protegida de manglares y bosque de corcho, refugio de aves, caimanes y manatíes.'
  UNION ALL SELECT 'Serranía de Coraza', 'Colosó', 'atractivo_natural',
         'Reserva forestal de los Montes de María con arroyos, pozas y senderos de bosque seco tropical.'
  UNION ALL SELECT 'Artesanías de Sampués', 'Sampués', 'atractivo_cultural',
         'Talleres donde se trenza la caña flecha del sombrero vueltiao y otras artesanías de tradición zenú.'
  UNION ALL SELECT 'Basílica del Señor de los Milagros', 'San Benito Abad', 'lugar_turistico',
         'Templo de peregrinación religiosa más visitado del departamento, a orillas de la ciénaga.'
) n
JOIN municipios m ON m.nombre = n.municipio
WHERE NOT EXISTS (SELECT 1 FROM destinos d WHERE d.nombre = n.nombre);

-- ---------------------------------------------------------------------------
-- ALOJAMIENTOS  (ejemplos inventados)
-- ---------------------------------------------------------------------------
INSERT INTO alojamientos (nombre, municipio_id, tipo, descripcion, precio_noche, capacidad, estrellas, servicios)
SELECT n.nombre, m.id, n.tipo, n.descripcion, n.precio_noche, n.capacidad, n.estrellas, n.servicios
FROM (
  SELECT 'Hotel Mar de Coveñas' AS nombre, 'Coveñas' AS municipio, 'hotel' AS tipo,
         'Hotel frente a la playa con piscina, restaurante y habitaciones con balcón al mar.' AS descripcion,
         350000.00 AS precio_noche, 4 AS capacidad, 4 AS estrellas,
         '["wifi", "piscina", "aire_acondicionado", "restaurante", "parqueadero"]' AS servicios
  UNION ALL SELECT 'Hotel Plaza Sabanas', 'Sincelejo', 'hotel',
         'Hotel céntrico a una cuadra del parque Santander, pensado para viajes de trabajo y paseo.',
         210000.00, 2, 3, '["wifi", "aire_acondicionado", "restaurante", "parqueadero"]'
  UNION ALL SELECT 'Hostal La Gaviota', 'Santiago de Tolú', 'hostal',
         'Hostal sencillo a media cuadra del malecón, con cocina compartida y terraza.',
         75000.00, 4, 1, '["wifi", "ventilador", "cocina"]'
  UNION ALL SELECT 'Morrosquillo Backpackers', 'Santiago de Tolú', 'hostal',
         'Habitaciones compartidas y privadas para mochileros, con tours a las islas.',
         55000.00, 6, 1, '["wifi", "ventilador", "lockers"]'
  UNION ALL SELECT 'Posada Nativa Rincón del Mar', 'San Onofre', 'posada',
         'Posada familiar a pasos de la playa, con desayuno típico incluido.',
         140000.00, 3, 2, '["wifi", "desayuno", "ventilador"]'
  UNION ALL SELECT 'Cabañas Punta Manglar', 'Coveñas', 'cabana',
         'Cabañas de madera entre palmeras, con cocina equipada y zona de hamacas.',
         230000.00, 5, 3, '["cocina", "aire_acondicionado", "parqueadero"]'
  UNION ALL SELECT 'Camping Playa Berrugas', 'San Onofre', 'camping',
         'Zona de camping frente al mar con alquiler de carpas, duchas y fogata.',
         40000.00, 2, NULL, '["banos", "duchas", "alquiler_carpas"]'
) n
JOIN municipios m ON m.nombre = n.municipio
WHERE NOT EXISTS (SELECT 1 FROM alojamientos a WHERE a.nombre = n.nombre);

-- ---------------------------------------------------------------------------
-- RESTAURANTES Y PLATOS  (ejemplos inventados)
-- ---------------------------------------------------------------------------
INSERT INTO restaurantes (nombre, municipio_id, tipo_cocina, descripcion, rango_precio)
SELECT n.nombre, m.id, n.tipo_cocina, n.descripcion, n.rango_precio
FROM (
  SELECT 'El Muelle de Tolú' AS nombre, 'Santiago de Tolú' AS municipio, 'mariscos' AS tipo_cocina,
         'Pescado y mariscos frescos con vista al malecón.' AS descripcion, 'medio' AS rango_precio
  UNION ALL SELECT 'Pargo Rojo', 'San Onofre', 'mariscos',
         'Cocina de pescadores en Rincón del Mar: pargo, langosta y arroz de coco.', 'medio'
  UNION ALL SELECT 'Cayena Cocina de Autor', 'Coveñas', 'internacional',
         'Menú de autor que mezcla técnicas internacionales con productos del Caribe.', 'alto'
  UNION ALL SELECT 'Brasas del Golfo', 'Coveñas', 'internacional',
         'Parrilla, pastas y pizzas al horno de leña, para cenar en familia.', 'medio'
  UNION ALL SELECT 'Arepas y Fritos Doña Ana', 'Sincelejo', 'comida_rapida',
         'Arepa de huevo, carimañolas y empanadas recién hechas.', 'economico'
  UNION ALL SELECT 'Verde Manglar', 'Santiago de Tolú', 'vegetariana',
         'Bowls, jugos naturales y platos sin carne con ingredientes locales.', 'medio'
  UNION ALL SELECT 'Fogón Sabanero', 'Corozal', 'tipica',
         'Comida casera de las sabanas cocinada en fogón de leña.', 'economico'
) n
JOIN municipios m ON m.nombre = n.municipio
WHERE NOT EXISTS (SELECT 1 FROM restaurantes r WHERE r.nombre = n.nombre);

-- Un plato se considera repetido si ya existe con el mismo nombre en el mismo restaurante.
INSERT INTO platos (restaurante_id, nombre, descripcion, precio, es_tipico)
SELECT r.id, n.nombre, n.descripcion, n.precio, n.es_tipico
FROM (
  SELECT 'El Muelle de Tolú' AS restaurante, 'Cazuela de mariscos' AS nombre,
         'Mariscos en salsa de coco, servida con arroz y patacón.' AS descripcion, 48000.00 AS precio, TRUE AS es_tipico
  UNION ALL SELECT 'El Muelle de Tolú', 'Pargo frito', 'Pargo rojo entero con arroz de coco y ensalada.', 52000.00, TRUE
  UNION ALL SELECT 'Pargo Rojo', 'Langosta al ajillo', 'Langosta del golfo en mantequilla de ajo.', 85000.00, FALSE
  UNION ALL SELECT 'Pargo Rojo', 'Arroz de coco con pescado', 'Pescado del día con arroz de coco titoté.', 35000.00, TRUE
  UNION ALL SELECT 'Cayena Cocina de Autor', 'Ceviche de pesca blanca', 'Pesca blanca curada en limón con mango y ají dulce.', 42000.00, FALSE
  UNION ALL SELECT 'Cayena Cocina de Autor', 'Posta negra cartagenera', 'Res en salsa de panela, con puré de ñame.', 58000.00, TRUE
  UNION ALL SELECT 'Brasas del Golfo', 'Pizza de camarón', 'Pizza al horno de leña con camarón y queso costeño.', 39000.00, FALSE
  UNION ALL SELECT 'Arepas y Fritos Doña Ana', 'Arepa de huevo', 'Arepa frita rellena de huevo y carne molida.', 6000.00, TRUE
  UNION ALL SELECT 'Arepas y Fritos Doña Ana', 'Carimañola', 'Masa de yuca rellena de queso o carne.', 4000.00, TRUE
  UNION ALL SELECT 'Verde Manglar', 'Bowl caribeño', 'Arroz integral, aguacate, plátano maduro y frijol.', 28000.00, FALSE
  UNION ALL SELECT 'Fogón Sabanero', 'Mote de queso', 'Sopa de ñame con queso costeño y suero.', 16000.00, TRUE
  UNION ALL SELECT 'Fogón Sabanero', 'Bollo limpio con suero', 'Bollo de maíz con suero atollabuey.', 8000.00, TRUE
) n
JOIN restaurantes r ON r.nombre = n.restaurante
WHERE NOT EXISTS (SELECT 1 FROM platos p WHERE p.restaurante_id = r.id AND p.nombre = n.nombre);

-- ---------------------------------------------------------------------------
-- EXPERIENCIAS  (ejemplos inventados)
-- ---------------------------------------------------------------------------
INSERT INTO experiencias (nombre, municipio_id, tipo, descripcion, precio, duracion_horas, operador)
SELECT n.nombre, m.id, n.tipo, n.descripcion, n.precio, n.duracion_horas, 'Operador de ejemplo'
FROM (
  SELECT 'Snorkel en Isla Boquerón' AS nombre, 'San Onofre' AS municipio, 'acuatica' AS tipo,
         'Salida en lancha desde Rincón del Mar para nadar entre los arrecifes de la isla.' AS descripcion,
         120000.00 AS precio, 5.0 AS duracion_horas
  UNION ALL SELECT 'Buceo para principiantes', 'Santiago de Tolú', 'acuatica',
         'Bautizo de buceo con instructor certificado, sin experiencia previa.', 250000.00, 4.0
  UNION ALL SELECT 'Kayak al atardecer', 'Coveñas', 'aventura',
         'Recorrido en kayak por la costa de Coveñas hasta ver la puesta de sol.', 70000.00, 2.0
  UNION ALL SELECT 'Cabalgata por las sabanas', 'Corozal', 'aventura',
         'Paseo a caballo por fincas ganaderas con almuerzo típico.', 90000.00, 4.0
  UNION ALL SELECT 'Senderismo en la Serranía de Coraza', 'Colosó', 'ecoturismo',
         'Caminata guiada por bosque seco tropical hasta las pozas de agua natural.', 50000.00, 5.0
  UNION ALL SELECT 'Avistamiento de aves en El Corchal', 'San Onofre', 'ecoturismo',
         'Recorrido temprano en bote por el manglar con guía local y binoculares.', 65000.00, 3.0
  UNION ALL SELECT 'Taller de sombrero vueltiao', 'Sampués', 'cultural',
         'Aprende a trenzar la caña flecha con artesanos de Sampués.', 35000.00, 3.0
  UNION ALL SELECT 'Clase de cocina costeña', 'Coveñas', 'gastronomica',
         'Prepara arroz de coco, patacón y pescado frito con una cocinera local.', 80000.00, 3.0
) n
JOIN municipios m ON m.nombre = n.municipio
WHERE NOT EXISTS (SELECT 1 FROM experiencias e WHERE e.nombre = n.nombre);

-- ---------------------------------------------------------------------------
-- EVENTOS
-- La Fiesta del Señor de los Milagros es real (14 de septiembre); los demas
-- son (inventados) para que la agenda tenga eventos proximos.
-- ---------------------------------------------------------------------------
INSERT INTO eventos (nombre, municipio_id, tipo, descripcion, fecha_inicio, fecha_fin, lugar, precio_entrada)
SELECT n.nombre, m.id, n.tipo, n.descripcion, n.fecha_inicio, n.fecha_fin, n.lugar, n.precio_entrada
FROM (
  SELECT 'Torneo de Vóley Playa del Golfo' AS nombre, 'Coveñas' AS municipio, 'deportivo' AS tipo,
         'Torneo por parejas abierto a equipos de toda la región.' AS descripcion,
         '2026-11-21' AS fecha_inicio, '2026-11-22' AS fecha_fin, 'Primera Ensenada de Coveñas' AS lugar,
         NULL AS precio_entrada
  UNION ALL SELECT 'Noche de Velitas en el Malecón', 'Santiago de Tolú', 'religioso',
         'Encendido de velas y faroles a lo largo del malecón para recibir la Navidad.',
         '2026-12-07', '2026-12-07', 'Malecón de Tolú', NULL
  UNION ALL SELECT 'Feria Artesanal de Sampués', 'Sampués', 'feria',
         'Muestra y venta de sombreros vueltiaos, mochilas y artesanías en caña flecha.',
         '2026-12-12', '2026-12-15', 'Plaza principal de Sampués', NULL
  UNION ALL SELECT 'Pesebres y Novenas de Sincelejo', 'Sincelejo', 'cultural',
         'Concurso de pesebres y novenas navideñas con música de bandas.',
         '2026-12-16', '2026-12-24', 'Parque Santander', NULL
  UNION ALL SELECT 'Festival de Fin de Año en la Playa', 'Coveñas', 'festival',
         'Conciertos de música tropical y champeta para despedir el año frente al mar.',
         '2026-12-29', '2026-12-31', 'Playa de Coveñas', 30000.00
  UNION ALL SELECT 'Travesía a Nado del Golfo', 'Santiago de Tolú', 'deportivo',
         'Competencia de aguas abiertas de 3 km frente al malecón.',
         '2027-02-14', '2027-02-14', 'Malecón de Tolú', 50000.00
  UNION ALL SELECT 'Fiesta del Señor de los Milagros', 'San Benito Abad', 'religioso',
         'Peregrinación y procesiones que reúnen a miles de fieles de la región Caribe.',
         '2027-09-13', '2027-09-14', 'Basílica del Señor de los Milagros', NULL
) n
JOIN municipios m ON m.nombre = n.municipio
WHERE NOT EXISTS (SELECT 1 FROM eventos e WHERE e.nombre = n.nombre);
