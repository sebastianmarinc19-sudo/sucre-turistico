const { Client } = require('@elastic/elasticsearch');

// En local: Elasticsearch sin seguridad (docker-compose). En Elastic Cloud:
// la URL del deployment y una API key.
const client = new Client({
  node: process.env.ELASTICSEARCH_HOST || 'http://localhost:9200',
  auth: process.env.ELASTICSEARCH_API_KEY ? { apiKey: process.env.ELASTICSEARCH_API_KEY } : undefined,
});

const INDICE = 'turismo_index';

module.exports = { client, INDICE };
