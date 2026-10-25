// Lo que cada seccion del catalogo necesita saber de si misma: de donde salen
// sus datos, como se llama su columna de clasificacion y como se muestra.
// Las tarjetas, la pagina de detalle y el mapa leen de aqui, para que una
// etiqueta no quede escrita distinto en tres lugares.

export const CATALOGO = {
  destinos: {
    ruta: '/destinos',
    endpoint: '/api/destinos',
    titulo: 'Destinos',
    singular: 'destino',
    icono: 'fa-map-location-dot',
    campoCategoria: 'categoria',
    etiquetas: {
      playa: 'Playa',
      atractivo_natural: 'Atractivo natural',
      atractivo_cultural: 'Atractivo cultural',
      lugar_turistico: 'Lugar turístico',
    },
  },
  alojamiento: {
    ruta: '/alojamiento',
    endpoint: '/api/alojamientos',
    titulo: 'Alojamiento',
    singular: 'alojamiento',
    icono: 'fa-hotel',
    campoCategoria: 'tipo',
    etiquetas: { hotel: 'Hotel', hostal: 'Hostal', posada: 'Posada', cabana: 'Cabaña', camping: 'Camping' },
  },
  gastronomia: {
    ruta: '/gastronomia',
    endpoint: '/api/gastronomia',
    titulo: 'Gastronomía',
    singular: 'restaurante',
    icono: 'fa-utensils',
    campoCategoria: 'tipo_cocina',
    etiquetas: {
      tipica: 'Típica',
      mariscos: 'Mariscos',
      internacional: 'Internacional',
      comida_rapida: 'Comida rápida',
      vegetariana: 'Vegetariana',
    },
  },
  experiencias: {
    ruta: '/experiencias',
    endpoint: '/api/experiencias',
    titulo: 'Experiencias',
    singular: 'experiencia',
    icono: 'fa-person-hiking',
    campoCategoria: 'tipo',
    etiquetas: {
      acuatica: 'Acuática',
      cultural: 'Cultural',
      ecoturismo: 'Ecoturismo',
      aventura: 'Aventura',
      gastronomica: 'Gastronómica',
    },
  },
  eventos: {
    ruta: '/eventos',
    endpoint: '/api/eventos',
    titulo: 'Eventos',
    singular: 'evento',
    icono: 'fa-calendar-days',
    campoCategoria: 'tipo',
    etiquetas: { festival: 'Festival', feria: 'Feria', religioso: 'Religioso', cultural: 'Cultural', deportivo: 'Deportivo' },
  },
};

export const RANGOS_PRECIO = {
  economico: { simbolo: '$', texto: 'Económico' },
  medio: { simbolo: '$$', texto: 'Precio medio' },
  alto: { simbolo: '$$$', texto: 'Precio alto' },
};

export function categoriaDe(seccion, registro) {
  return registro[CATALOGO[seccion].campoCategoria];
}

export function etiquetaDe(seccion, registro) {
  const valor = categoriaDe(seccion, registro);
  return CATALOGO[seccion].etiquetas[valor] || valor;
}

export function rutaDetalle(seccion, registro) {
  return `${CATALOGO[seccion].ruta}/${registro.id}`;
}

export const pesos = (valor) => `$${Number(valor).toLocaleString('es-CO')}`;

// Centro aproximado de la cabecera de cada municipio de Sucre [lat, lng].
// La base no guarda coordenadas por lugar, asi que el mapa ubica cada
// registro en su municipio: es honesto (no inventa un punto exacto) y basta
// para ver como se reparte la oferta en el departamento.
export const COORDENADAS_MUNICIPIO = {
  'Sincelejo': [9.3047, -75.3978],
  'Buenavista': [9.3197, -74.9725],
  'Caimito': [8.7900, -75.1175],
  'Chalán': [9.5450, -75.3150],
  'Colosó': [9.4942, -75.3528],
  'Corozal': [9.3183, -75.2933],
  'Coveñas': [9.4028, -75.6800],
  'El Roble': [9.1000, -75.1950],
  'Galeras': [9.1611, -75.0483],
  'Guaranda': [8.4672, -74.5369],
  'La Unión': [8.8533, -75.2786],
  'Los Palmitos': [9.3792, -75.2681],
  'Majagual': [8.5414, -74.6250],
  'Morroa': [9.3336, -75.3061],
  'Ovejas': [9.5261, -75.2269],
  'Palmito': [9.3317, -75.5403],
  'Sampués': [9.1836, -75.3817],
  'San Benito Abad': [8.9289, -75.0272],
  'San Juan de Betulia': [9.2736, -75.2414],
  'San Marcos': [8.6583, -75.1269],
  'San Onofre': [9.7372, -75.5264],
  'San Pedro': [9.3958, -75.0647],
  'Sincé': [9.2436, -75.1464],
  'Sucre': [8.8114, -74.7214],
  'Santiago de Tolú': [9.5239, -75.5814],
  'Toluviejo': [9.4503, -75.4386],
};
