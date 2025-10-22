const { Client } = require('@elastic/elasticsearch');

/**
 * Elasticsearch Client Configuration
 *
 * Supports two connection methods:
 * 1. Cloud ID + API Key (Elastic Cloud)
 * 2. Direct Host URL + Username/Password (Self-hosted)
 */

let client = null;

/**
 * Initialize Elasticsearch client
 * @returns {Client} Elasticsearch client instance
 */
function initElasticsearchClient() {
  if (client) {
    return client;
  }

  const config = {};

  // Method 1: Cloud ID with API Key (recommended for Elastic Cloud)
  if (process.env.ELASTICSEARCH_CLOUD_ID && process.env.ELASTICSEARCH_API_KEY) {
    config.cloud = {
      id: process.env.ELASTICSEARCH_CLOUD_ID
    };
    config.auth = {
      apiKey: process.env.ELASTICSEARCH_API_KEY
    };
    console.log('Initializing Elasticsearch client with Cloud ID and API Key');
  }
  // Method 2: Direct host with username/password
  else if (process.env.ELASTICSEARCH_HOST) {
    config.node = process.env.ELASTICSEARCH_HOST;

    if (process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD) {
      config.auth = {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD
      };
    } else if (process.env.ELASTICSEARCH_API_KEY) {
      config.auth = {
        apiKey: process.env.ELASTICSEARCH_API_KEY
      };
    }
    console.log('Initializing Elasticsearch client with host:', process.env.ELASTICSEARCH_HOST);
  }
  // No configuration found
  else {
    throw new Error(
      'Elasticsearch configuration missing. Please set either:\n' +
      '  - ELASTICSEARCH_CLOUD_ID and ELASTICSEARCH_API_KEY, or\n' +
      '  - ELASTICSEARCH_HOST with credentials'
    );
  }

  // Add request timeout
  config.requestTimeout = 30000;
  config.maxRetries = 3;

  client = new Client(config);
  return client;
}

/**
 * Get Elasticsearch client instance
 * @returns {Client} Elasticsearch client instance
 */
function getClient() {
  if (!client) {
    return initElasticsearchClient();
  }
  return client;
}

/**
 * Test Elasticsearch connection
 * @returns {Promise<boolean>} Connection status
 */
async function testConnection() {
  try {
    const client = getClient();
    const health = await client.cluster.health();
    console.log('Elasticsearch cluster health:', health.status);
    return true;
  } catch (error) {
    console.error('Elasticsearch connection failed:', error.message);
    return false;
  }
}

/**
 * Search documents in Elasticsearch
 * @param {string} index - Index name
 * @param {object} query - Elasticsearch query
 * @param {number} size - Number of results to return
 * @param {number} from - Offset for pagination
 * @returns {Promise<object>} Search results
 */
async function search(index, query = { match_all: {} }, size = 10, from = 0) {
  try {
    const client = getClient();
    const result = await client.search({
      index: index || process.env.ELASTICSEARCH_INDEX,
      body: {
        query,
        size,
        from
      }
    });

    return {
      total: result.hits.total.value,
      hits: result.hits.hits.map(hit => ({
        id: hit._id,
        score: hit._score,
        ...hit._source
      }))
    };
  } catch (error) {
    console.error('Elasticsearch search error:', error.message);
    throw error;
  }
}

/**
 * Get a document by ID
 * @param {string} index - Index name
 * @param {string} id - Document ID
 * @returns {Promise<object>} Document data
 */
async function getById(index, id) {
  try {
    const client = getClient();
    const result = await client.get({
      index: index || process.env.ELASTICSEARCH_INDEX,
      id
    });

    return {
      id: result._id,
      ...result._source
    };
  } catch (error) {
    console.error('Elasticsearch get by ID error:', error.message);
    throw error;
  }
}

/**
 * Index a document
 * @param {string} index - Index name
 * @param {object} document - Document to index
 * @param {string} id - Optional document ID
 * @returns {Promise<object>} Index result
 */
async function indexDocument(index, document, id = null) {
  try {
    const client = getClient();
    const params = {
      index: index || process.env.ELASTICSEARCH_INDEX,
      body: document
    };

    if (id) {
      params.id = id;
    }

    const result = await client.index(params);
    return result;
  } catch (error) {
    console.error('Elasticsearch index error:', error.message);
    throw error;
  }
}

/**
 * Aggregate data
 * @param {string} index - Index name
 * @param {object} aggregations - Elasticsearch aggregations
 * @returns {Promise<object>} Aggregation results
 */
async function aggregate(index, aggregations) {
  try {
    const client = getClient();
    const result = await client.search({
      index: index || process.env.ELASTICSEARCH_INDEX,
      body: {
        size: 0,
        aggs: aggregations
      }
    });

    return result.aggregations;
  } catch (error) {
    console.error('Elasticsearch aggregation error:', error.message);
    throw error;
  }
}

module.exports = {
  initElasticsearchClient,
  getClient,
  testConnection,
  search,
  getById,
  indexDocument,
  aggregate
};
