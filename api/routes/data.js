const express = require('express');
const router = express.Router();
const elasticsearch = require('../config/elasticsearch');

/**
 * Data Routes - Elasticsearch Operations
 *
 * All routes handle data retrieval and manipulation with Elasticsearch
 */

/**
 * POST /api/data/search
 * Search documents in Elasticsearch
 *
 * Request body:
 * {
 *   "query": { ... },      // Elasticsearch query (optional, defaults to match_all)
 *   "index": "my-index",   // Index name (optional, uses env default)
 *   "size": 10,            // Number of results (optional, default: 10)
 *   "from": 0              // Offset for pagination (optional, default: 0)
 * }
 */
router.post('/search', async (req, res, next) => {
  try {
    const {
      query = { match_all: {} },
      index = null,
      size = 10,
      from = 0
    } = req.body;

    // Validate size and from
    if (size > 1000) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Size cannot exceed 1000',
          code: 'INVALID_SIZE'
        }
      });
    }

    const results = await elasticsearch.search(index, query, size, from);

    res.json({
      success: true,
      data: results.hits,
      total: results.total,
      pagination: {
        size,
        from,
        hasMore: from + size < results.total
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/data/:id
 * Get a document by ID
 *
 * Query params:
 * - index: Index name (optional, uses env default)
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { index = null } = req.query;

    const document = await elasticsearch.getById(index, id);

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    if (error.meta && error.meta.statusCode === 404) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Document not found',
          code: 'NOT_FOUND'
        }
      });
    }
    next(error);
  }
});

/**
 * POST /api/data/index
 * Index a new document
 *
 * Request body:
 * {
 *   "document": { ... },   // Document to index
 *   "index": "my-index",   // Index name (optional, uses env default)
 *   "id": "doc-id"         // Document ID (optional, auto-generated if not provided)
 * }
 */
router.post('/index', async (req, res, next) => {
  try {
    const {
      document,
      index = null,
      id = null
    } = req.body;

    if (!document || typeof document !== 'object') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Document object is required',
          code: 'INVALID_DOCUMENT'
        }
      });
    }

    const result = await elasticsearch.indexDocument(index, document, id);

    res.status(201).json({
      success: true,
      data: {
        id: result._id,
        index: result._index,
        result: result.result
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/data/aggregate
 * Perform aggregations on data
 *
 * Request body:
 * {
 *   "aggregations": { ... }, // Elasticsearch aggregations
 *   "index": "my-index"       // Index name (optional, uses env default)
 * }
 */
router.post('/aggregate', async (req, res, next) => {
  try {
    const {
      aggregations,
      index = null
    } = req.body;

    if (!aggregations || typeof aggregations !== 'object') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Aggregations object is required',
          code: 'INVALID_AGGREGATIONS'
        }
      });
    }

    const results = await elasticsearch.aggregate(index, aggregations);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/data/full-text-search
 * Simple full-text search across fields
 *
 * Request body:
 * {
 *   "q": "search query",     // Search query string
 *   "fields": ["field1"],    // Fields to search (optional)
 *   "index": "my-index",     // Index name (optional, uses env default)
 *   "size": 10,              // Number of results (optional, default: 10)
 *   "from": 0                // Offset for pagination (optional, default: 0)
 * }
 */
router.post('/full-text-search', async (req, res, next) => {
  try {
    const {
      q,
      fields = ['*'],
      index = null,
      size = 10,
      from = 0
    } = req.body;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Search query (q) is required',
          code: 'MISSING_QUERY'
        }
      });
    }

    // Build multi-match query
    const query = {
      multi_match: {
        query: q,
        fields: fields,
        fuzziness: 'AUTO'
      }
    };

    const results = await elasticsearch.search(index, query, size, from);

    res.json({
      success: true,
      data: results.hits,
      total: results.total,
      query: q,
      pagination: {
        size,
        from,
        hasMore: from + size < results.total
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
