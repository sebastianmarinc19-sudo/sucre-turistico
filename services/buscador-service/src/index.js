const express = require('express');
const cors = require('cors');
const { client, INDICE } = require('./es');
const { reindexar } = require('./indice');
const { construirBusqueda, formatearRespuesta, construirSugerencias } = require('./consultas');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4006;

app.get('/health', (req, res) => {
  res.json({ service: 'buscador-service', status: 'ok' });
});

// Si el indice aun no existe, Elasticsearch responde index_not_found: para el
// turista eso es "todavia no hay nada indexado", no un error del servidor.
function sinIndice(err) {
  return err.meta?.body?.error?.type === 'index_not_found_exception';
}

// Elasticsearch apagado o sin configurar (en produccion, hasta que se cree el
// deployment en Elastic Cloud). No es un error del codigo: el buscador
// simplemente no esta disponible todavia.
function sinElasticsearch(err) {
  return err.name === 'ConnectionError' || err.name === 'TimeoutError';
}

// Busqueda full-text con facets (historias 13 y 15).
// ?q=texto&tipo=&municipio=&categoria=&precio=&pagina=
app.get('/api/buscador', async (req, res) => {
  try {
    const respuesta = await client.search({ index: INDICE, ...construirBusqueda(req.query) });
    res.json(formatearRespuesta(respuesta));
  } catch (err) {
    if (sinIndice(err)) return res.status(503).json({ error: 'El buscador todavía no tiene datos. Intenta en un momento.' });
    if (sinElasticsearch(err)) return res.status(503).json({ error: 'El buscador no está disponible por ahora.' });
    res.status(500).json({ error: err.message });
  }
});

// Autocompletado mientras se escribe (historia 14). ?q=cov
app.get('/api/buscador/sugerencias', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json([]);
  try {
    const respuesta = await client.search({ index: INDICE, ...construirSugerencias(q) });
    res.json(respuesta.hits.hits.map((h) => h._source));
  } catch (err) {
    if (sinIndice(err) || sinElasticsearch(err)) return res.json([]);
    res.status(500).json({ error: err.message });
  }
});

// Vuelve a cargar el indice desde los microservicios. Es un POST, asi que el
// API Gateway exige token de administrador.
app.post('/api/buscador/reindexar', async (req, res) => {
  try {
    res.json(await reindexar());
  } catch (err) {
    res.status(502).json({ error: `No se pudo reindexar: ${err.message}` });
  }
});

// Al arrancar, si el indice no existe se llena solo. Los demas servicios
// pueden tardar en estar listos, por eso se reintenta unas veces.
async function indexarSiFalta(intentos = 6) {
  for (let i = 1; i <= intentos; i++) {
    try {
      if (await client.indices.exists({ index: INDICE })) return;
      const { total } = await reindexar();
      console.log(`Indice ${INDICE} creado con ${total} documentos`);
      return;
    } catch (err) {
      console.log(`Indexacion inicial, intento ${i}/${intentos}: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, 15000));
    }
  }
}

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`buscador-service escuchando en el puerto ${PORT}`);
    indexarSiFalta();
  });
}

module.exports = app;
