const { client, INDICE } = require('./es');

// Analizador en espanol que ademas ignora tildes: "coveñas" y "covenas"
// encuentran lo mismo, y "playas" encuentra "playa".
const CONFIGURACION = {
  settings: {
    analysis: {
      filter: {
        espanol_stop: { type: 'stop', stopwords: '_spanish_' },
        espanol_raiz: { type: 'stemmer', language: 'light_spanish' },
      },
      analyzer: {
        es_texto: { tokenizer: 'standard', filter: ['lowercase', 'asciifolding', 'espanol_stop', 'espanol_raiz'] },
        es_sugerencias: { tokenizer: 'standard', filter: ['lowercase', 'asciifolding'] },
      },
    },
  },
  mappings: {
    properties: {
      tipo: { type: 'keyword' },
      ref_id: { type: 'integer' },
      nombre: {
        type: 'text',
        analyzer: 'es_texto',
        fields: { sugerir: { type: 'search_as_you_type', analyzer: 'es_sugerencias' } },
      },
      descripcion: { type: 'text', analyzer: 'es_texto' },
      municipio: { type: 'keyword', fields: { texto: { type: 'text', analyzer: 'es_texto' } } },
      categoria: { type: 'keyword' },
      precio: { type: 'float' },
      fecha_inicio: { type: 'date' },
      fecha_fin: { type: 'date' },
      ruta: { type: 'keyword', index: false },
      imagen_url: { type: 'keyword', index: false },
    },
  },
};

// De donde sale cada catalogo y como se pasa al documento del indice.
// Se consulta la API de cada microservicio, no su tabla: el buscador no
// conoce la base de datos de los demas.
const FUENTES = [
  { tipo: 'destino', url: process.env.DESTINOS_URL || 'http://localhost:4001', ruta: '/api/destinos', pagina: '/', categoria: 'categoria', precio: null },
  { tipo: 'alojamiento', url: process.env.ALOJAMIENTO_URL || 'http://localhost:4002', ruta: '/api/alojamientos', pagina: '/alojamiento', categoria: 'tipo', precio: 'precio_noche' },
  { tipo: 'restaurante', url: process.env.GASTRONOMIA_URL || 'http://localhost:4003', ruta: '/api/gastronomia', pagina: '/gastronomia', categoria: 'tipo_cocina', precio: null },
  { tipo: 'experiencia', url: process.env.EXPERIENCIAS_URL || 'http://localhost:4004', ruta: '/api/experiencias', pagina: '/experiencias', categoria: 'tipo', precio: 'precio' },
  { tipo: 'evento', url: process.env.EVENTOS_URL || 'http://localhost:4005', ruta: '/api/eventos', pagina: '/eventos', categoria: 'tipo', precio: 'precio_entrada' },
];

function aDocumento(fuente, fila) {
  const precio = fuente.precio && fila[fuente.precio] != null ? Number(fila[fuente.precio]) : null;
  return {
    tipo: fuente.tipo,
    ref_id: fila.id,
    nombre: fila.nombre,
    descripcion: fila.descripcion || null,
    municipio: fila.municipio || null,
    categoria: fila[fuente.categoria] || null,
    precio,
    fecha_inicio: fila.fecha_inicio || null,
    fecha_fin: fila.fecha_fin || null,
    ruta: fuente.pagina,
    imagen_url: fila.imagen_url || null,
  };
}

// Los servicios gratis de Render responden 429 mientras despiertan.
async function traer(url, intentos = 12) {
  for (let i = 1; ; i++) {
    const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
    if (res.ok) return res.json();
    if (res.status !== 429 || i >= intentos) throw new Error(`${url} respondio ${res.status}`);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

// Borra el indice y lo vuelve a llenar con lo que hay hoy en los servicios.
async function reindexar() {
  const lotes = await Promise.all(FUENTES.map(async (f) => {
    const filas = await traer(`${f.url}${f.ruta}`);
    return filas.map((fila) => aDocumento(f, fila));
  }));
  const documentos = lotes.flat();

  if (await client.indices.exists({ index: INDICE })) await client.indices.delete({ index: INDICE });
  await client.indices.create({ index: INDICE, ...CONFIGURACION });

  if (documentos.length) {
    const operaciones = documentos.flatMap((d) => [{ index: { _index: INDICE, _id: `${d.tipo}-${d.ref_id}` } }, d]);
    const resultado = await client.bulk({ operations: operaciones, refresh: true });
    if (resultado.errors) throw new Error('Algunos documentos no se pudieron indexar');
  }

  const porTipo = {};
  for (const d of documentos) porTipo[d.tipo] = (porTipo[d.tipo] || 0) + 1;
  return { total: documentos.length, porTipo };
}

module.exports = { reindexar, aDocumento, FUENTES };
