// Que muestra y que edita el panel para cada entidad. Un solo componente
// (TablaCrud) lee esta configuracion, asi las cinco tablas se comportan igual.
//
// seccion: su clave en src/catalogo.js (icono, etiquetas y pagina de detalle).
// columnas: lo que se ve en la tabla.  campos: el formulario de crear/editar.
// Tipos de campo: texto, textarea, numero, fecha, opciones, municipio, lista.

const MUNICIPIO = { nombre: 'municipio_id', etiqueta: 'Municipio', tipo: 'municipio', obligatorio: true };
const DESCRIPCION = { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'textarea' };
const IMAGEN = { nombre: 'imagen_url', etiqueta: 'URL de la imagen', tipo: 'texto' };

const opciones = (...pares) => pares.map(([valor, etiqueta]) => ({ valor, etiqueta }));

export const ENTIDADES = [
  {
    clave: 'destinos',
    seccion: 'destinos',
    titulo: 'Destinos',
    singular: 'destino',
    endpoint: '/api/destinos',
    columnas: [
      { nombre: 'nombre', etiqueta: 'Nombre' },
      { nombre: 'municipio', etiqueta: 'Municipio' },
      { nombre: 'categoria', etiqueta: 'Categoría' },
    ],
    campos: [
      { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', obligatorio: true },
      MUNICIPIO,
      {
        nombre: 'categoria', etiqueta: 'Categoría', tipo: 'opciones', obligatorio: true,
        opciones: opciones(['playa', 'Playa'], ['atractivo_natural', 'Atractivo natural'], ['atractivo_cultural', 'Atractivo cultural'], ['lugar_turistico', 'Lugar turístico']),
      },
      DESCRIPCION,
      IMAGEN,
    ],
  },
  {
    clave: 'alojamientos',
    seccion: 'alojamiento',
    titulo: 'Alojamientos',
    singular: 'alojamiento',
    endpoint: '/api/alojamientos',
    columnas: [
      { nombre: 'nombre', etiqueta: 'Nombre' },
      { nombre: 'municipio', etiqueta: 'Municipio' },
      { nombre: 'tipo', etiqueta: 'Tipo' },
      { nombre: 'precio_noche', etiqueta: 'Precio/noche' },
    ],
    campos: [
      { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', obligatorio: true },
      MUNICIPIO,
      {
        nombre: 'tipo', etiqueta: 'Tipo', tipo: 'opciones', obligatorio: true,
        opciones: opciones(['hotel', 'Hotel'], ['hostal', 'Hostal'], ['posada', 'Posada'], ['cabana', 'Cabaña'], ['camping', 'Camping']),
      },
      { nombre: 'precio_noche', etiqueta: 'Precio por noche', tipo: 'numero' },
      { nombre: 'capacidad', etiqueta: 'Capacidad (personas)', tipo: 'numero' },
      { nombre: 'estrellas', etiqueta: 'Estrellas (1-5)', tipo: 'numero' },
      { nombre: 'servicios', etiqueta: 'Servicios (separados por coma)', tipo: 'lista' },
      { nombre: 'direccion', etiqueta: 'Dirección', tipo: 'texto' },
      { nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'texto' },
      DESCRIPCION,
      IMAGEN,
    ],
  },
  {
    clave: 'gastronomia',
    seccion: 'gastronomia',
    titulo: 'Gastronomía',
    singular: 'restaurante',
    endpoint: '/api/gastronomia',
    columnas: [
      { nombre: 'nombre', etiqueta: 'Nombre' },
      { nombre: 'municipio', etiqueta: 'Municipio' },
      { nombre: 'tipo_cocina', etiqueta: 'Cocina' },
      { nombre: 'rango_precio', etiqueta: 'Precio' },
    ],
    campos: [
      { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', obligatorio: true },
      MUNICIPIO,
      {
        nombre: 'tipo_cocina', etiqueta: 'Tipo de cocina', tipo: 'opciones', obligatorio: true,
        opciones: opciones(['tipica', 'Típica'], ['mariscos', 'Mariscos'], ['internacional', 'Internacional'], ['comida_rapida', 'Comida rápida'], ['vegetariana', 'Vegetariana']),
      },
      {
        nombre: 'rango_precio', etiqueta: 'Rango de precio', tipo: 'opciones',
        opciones: opciones(['economico', 'Económico'], ['medio', 'Medio'], ['alto', 'Alto']),
      },
      { nombre: 'direccion', etiqueta: 'Dirección', tipo: 'texto' },
      { nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'texto' },
      DESCRIPCION,
      IMAGEN,
    ],
  },
  {
    clave: 'experiencias',
    seccion: 'experiencias',
    titulo: 'Experiencias',
    singular: 'experiencia',
    endpoint: '/api/experiencias',
    columnas: [
      { nombre: 'nombre', etiqueta: 'Nombre' },
      { nombre: 'municipio', etiqueta: 'Municipio' },
      { nombre: 'tipo', etiqueta: 'Tipo' },
      { nombre: 'precio', etiqueta: 'Precio' },
    ],
    campos: [
      { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', obligatorio: true },
      MUNICIPIO,
      {
        nombre: 'tipo', etiqueta: 'Tipo', tipo: 'opciones', obligatorio: true,
        opciones: opciones(['acuatica', 'Acuática'], ['cultural', 'Cultural'], ['ecoturismo', 'Ecoturismo'], ['aventura', 'Aventura'], ['gastronomica', 'Gastronómica']),
      },
      { nombre: 'precio', etiqueta: 'Precio por persona', tipo: 'numero' },
      { nombre: 'duracion_horas', etiqueta: 'Duración (horas)', tipo: 'numero' },
      { nombre: 'operador', etiqueta: 'Operador', tipo: 'texto' },
      DESCRIPCION,
      IMAGEN,
    ],
  },
  {
    clave: 'eventos',
    seccion: 'eventos',
    titulo: 'Eventos',
    singular: 'evento',
    endpoint: '/api/eventos',
    columnas: [
      { nombre: 'nombre', etiqueta: 'Nombre' },
      { nombre: 'municipio', etiqueta: 'Municipio' },
      { nombre: 'tipo', etiqueta: 'Tipo' },
      { nombre: 'fecha_inicio', etiqueta: 'Inicio' },
    ],
    campos: [
      { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', obligatorio: true },
      MUNICIPIO,
      {
        nombre: 'tipo', etiqueta: 'Tipo', tipo: 'opciones', obligatorio: true,
        opciones: opciones(['festival', 'Festival'], ['feria', 'Feria'], ['religioso', 'Religioso'], ['cultural', 'Cultural'], ['deportivo', 'Deportivo']),
      },
      { nombre: 'fecha_inicio', etiqueta: 'Fecha de inicio', tipo: 'fecha', obligatorio: true },
      { nombre: 'fecha_fin', etiqueta: 'Fecha de fin', tipo: 'fecha' },
      { nombre: 'lugar', etiqueta: 'Lugar', tipo: 'texto' },
      { nombre: 'precio_entrada', etiqueta: 'Precio de entrada (vacío = libre)', tipo: 'numero' },
      DESCRIPCION,
      IMAGEN,
    ],
  },
];
