// Arma las consultas a Elasticsearch. Sin conexion: se puede probar solo.

const RANGOS_PRECIO = [
  { key: 'hasta-50000', to: 50000, etiqueta: 'Hasta $50.000' },
  { key: '50000-150000', from: 50000, to: 150000, etiqueta: '$50.000 – $150.000' },
  { key: '150000-300000', from: 150000, to: 300000, etiqueta: '$150.000 – $300.000' },
  { key: 'desde-300000', from: 300000, etiqueta: 'Más de $300.000' },
];

const POR_PAGINA = 20;

// Un filtro por dimension de facet. Se separan porque cada facet se cuenta
// con los filtros de LAS OTRAS dimensiones: asi, al elegir un municipio, el
// facet de municipio sigue mostrando los demas para poder cambiar.
function filtrosPorDimension({ tipo, municipio, categoria, precio }) {
  const filtros = {};
  if (tipo) filtros.tipo = { term: { tipo } };
  if (municipio) filtros.municipio = { term: { municipio } };
  if (categoria) filtros.categoria = { term: { categoria } };
  const rango = RANGOS_PRECIO.find((r) => r.key === precio);
  if (rango) filtros.precio = { range: { precio: { ...(rango.from != null && { gte: rango.from }), ...(rango.to != null && { lt: rango.to }) } } };
  return filtros;
}

function consultaTexto(q) {
  if (!q) return { match_all: {} };
  return {
    multi_match: {
      query: q,
      fields: ['nombre^3', 'municipio.texto^2', 'descripcion'],
      fuzziness: 'AUTO',
    },
  };
}

function construirBusqueda(parametros) {
  const { q, pagina } = parametros;
  const filtros = filtrosPorDimension(parametros);
  const todos = Object.values(filtros);
  const sinLa = (dimension) => Object.entries(filtros).filter(([d]) => d !== dimension).map(([, f]) => f);
  const facet = (dimension, agg) => ({ filter: { bool: { filter: sinLa(dimension) } }, aggs: { valores: agg } });

  const numeroPagina = Math.max(1, Number(pagina) || 1);
  return {
    query: consultaTexto(q),
    post_filter: { bool: { filter: todos } },
    from: (numeroPagina - 1) * POR_PAGINA,
    size: POR_PAGINA,
    aggs: {
      tipo: facet('tipo', { terms: { field: 'tipo', size: 10 } }),
      municipio: facet('municipio', { terms: { field: 'municipio', size: 30 } }),
      categoria: facet('categoria', { terms: { field: 'categoria', size: 30 } }),
      precio: facet('precio', { range: { field: 'precio', keyed: false, ranges: RANGOS_PRECIO.map(({ key, from, to }) => ({ key, from, to })) } }),
    },
  };
}

function formatearRespuesta(respuesta) {
  const facet = (nombre) => respuesta.aggregations[nombre].valores.buckets
    .filter((b) => b.doc_count > 0)
    .map((b) => ({ valor: b.key, cantidad: b.doc_count }));
  const etiquetas = Object.fromEntries(RANGOS_PRECIO.map((r) => [r.key, r.etiqueta]));

  return {
    total: respuesta.hits.total.value,
    resultados: respuesta.hits.hits.map((h) => ({ ...h._source, puntaje: h._score })),
    facets: {
      tipo: facet('tipo'),
      municipio: facet('municipio'),
      categoria: facet('categoria'),
      precio: facet('precio').map((p) => ({ ...p, etiqueta: etiquetas[p.valor] })),
    },
  };
}

function construirSugerencias(q) {
  return {
    size: 8,
    _source: ['tipo', 'nombre', 'municipio', 'ruta'],
    query: {
      multi_match: {
        query: q,
        type: 'bool_prefix',
        fields: ['nombre.sugerir', 'nombre.sugerir._2gram', 'nombre.sugerir._3gram'],
      },
    },
  };
}

module.exports = { construirBusqueda, formatearRespuesta, construirSugerencias, RANGOS_PRECIO, POR_PAGINA };
