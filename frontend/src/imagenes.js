// Foto de respaldo cuando un registro no tiene imagen_url: una foto
// representativa de su categoria (las del prototipo de interfaz y otras
// revisadas a mano). En cuanto el administrador le pone una imagen desde el
// panel, se usa esa.
//
// Algunas categorias tienen varias fotos: se elige una segun el id del
// registro, para que dos playas seguidas no salgan con la misma imagen y cada
// registro conserve siempre la suya.

const foto = (id, ancho = 800, alto = 500) =>
  `https://images.unsplash.com/photo-${id}?w=${ancho}&h=${alto}&fit=crop&q=75`;

const PLAYA = '1507525428034-b723cf961d3e';
const CABANA = '1520250497591-112f2f40a3f4';
const FIESTA = '1533174072545-7a4b6ad7a6c3';
const MAR_AFUERA = '1559827260-dc66d52bef19';

const POR_CATEGORIA = {
  // destinos
  playa: [PLAYA, '1519046904884-53103b34b206', '1506953823976-52e1fdc0149a', '1559128010-7c1ad6e1b6a5', '1473116763249-2faaef81ccda'],
  atractivo_natural: ['1510414842594-a61c69b5ae57', '1441974231531-c6227db76b6e'],
  atractivo_cultural: ['1512343879784-a960bf40e7f2'],
  lugar_turistico: ['1533587851505-d119e13fa0d7'],
  // alojamientos
  hotel: ['1571896349842-33c89424de2d', '1566073771259-6a8506099945', '1551882547-ff40c63fe5fa', '1540541338287-41700207dee6'],
  hostal: ['1542314831-068cd1dbfeeb'],
  posada: ['1582719508461-905c673771fd'],
  cabana: [CABANA],
  camping: ['1504280390367-361c6d9f38f4', CABANA],
  // restaurantes
  tipica: ['1504674900247-0877df9cc836'],
  mariscos: ['1414235077428-338989a2e8c0', '1559339352-11d035aa65de'],
  internacional: ['1515669097368-22e68427d265', '1555396273-367ea4eb4db5', '1517248135467-4c7edcad34c4'],
  comida_rapida: ['1565299624946-b28f40a0ae38'],
  vegetariana: ['1540189549336-e6e99c3679fe'],
  // experiencias
  acuatica: ['1505118380757-91f5f5632de0', '1544551763-46a013bb70d5', '1530053969600-caed2596d242', '1544551763-77ef2d0cfc6c'],
  ecoturismo: ['1476514525535-07fb3b4ae5f1', '1441974231531-c6227db76b6e'],
  aventura: [MAR_AFUERA],
  gastronomica: ['1467003909585-2f8a72700288'],
  // eventos (cultural lo comparten experiencias y eventos)
  festival: [FIESTA, '1492684223066-81342ee5ff30', '1470229722913-7c0e2dbbafd3'],
  feria: [FIESTA],
  religioso: ['1438032005730-c779502df39b', '1519491050282-cf00c82424b4'],
  cultural: ['1514525253161-7a46d19cd819'],
  deportivo: [MAR_AFUERA],
};

export function imagenDe(registro, categoria) {
  if (registro.imagen_url) return registro.imagen_url;
  const opciones = POR_CATEGORIA[categoria] || [PLAYA];
  return foto(opciones[(Number(registro.id) || 0) % opciones.length]);
}

export const IMAGEN_HERO = foto(PLAYA, 1600, 800);
