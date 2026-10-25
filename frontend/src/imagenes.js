// Foto de respaldo cuando un registro no tiene imagen_url: una foto
// representativa de su categoria (las mismas del prototipo de interfaz).
// En cuanto el administrador le pone una imagen desde el panel, se usa esa.

const foto = (id, ancho = 800, alto = 500) =>
  `https://images.unsplash.com/photo-${id}?w=${ancho}&h=${alto}&fit=crop&q=75`;

const PLAYA = '1507525428034-b723cf961d3e';

const POR_CATEGORIA = {
  // destinos
  playa: PLAYA,
  atractivo_natural: '1510414842594-a61c69b5ae57',
  atractivo_cultural: '1512343879784-a960bf40e7f2',
  lugar_turistico: '1533587851505-d119e13fa0d7',
  // alojamientos
  hotel: '1571896349842-33c89424de2d',
  hostal: '1542314831-068cd1dbfeeb',
  posada: '1582719508461-905c673771fd',
  cabana: '1520250497591-112f2f40a3f4',
  camping: '1520250497591-112f2f40a3f4',
  // restaurantes
  tipica: '1504674900247-0877df9cc836',
  mariscos: '1414235077428-338989a2e8c0',
  internacional: '1515669097368-22e68427d265',
  comida_rapida: '1565299624946-b28f40a0ae38',
  vegetariana: '1540189549336-e6e99c3679fe',
  // experiencias
  acuatica: '1505118380757-91f5f5632de0',
  ecoturismo: '1476514525535-07fb3b4ae5f1',
  aventura: '1559827260-dc66d52bef19',
  gastronomica: '1467003909585-2f8a72700288',
  // eventos (cultural lo comparten experiencias y eventos)
  festival: '1533174072545-7a4b6ad7a6c3',
  feria: '1533174072545-7a4b6ad7a6c3',
  religioso: '1511795409834-ef04bbd61622',
  cultural: '1514525253161-7a46d19cd819',
  deportivo: '1559827260-dc66d52bef19',
};

export function imagenDe(registro, categoria) {
  return registro.imagen_url || foto(POR_CATEGORIA[categoria] || PLAYA);
}

export const IMAGEN_HERO = foto(PLAYA, 1600, 800);
