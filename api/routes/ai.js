const express = require('express');
const router = express.Router();
const anthropic = require('../config/anthropic');

/**
 * AI Routes - Claude API Operations
 *
 * All routes handle AI interactions using Claude
 */

/**
 * POST /api/ai/chat
 * Send a message to Claude and get a response
 *
 * Request body:
 * {
 *   "message": "Hello Claude!",           // User message (required)
 *   "systemPrompt": "You are...",         // System prompt (optional)
 *   "maxTokens": 1024,                    // Max response tokens (optional)
 *   "temperature": 1,                     // Response randomness 0-1 (optional)
 *   "model": "claude-3-5-sonnet-20241022" // Model to use (optional)
 * }
 */
router.post('/chat', async (req, res, next) => {
  try {
    const {
      message,
      systemPrompt = null,
      maxTokens = 1024,
      temperature = 1,
      model = null
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Message is required and must be a string',
          code: 'INVALID_MESSAGE'
        }
      });
    }

    const response = await anthropic.sendMessage(message, {
      systemPrompt,
      maxTokens,
      temperature,
      model
    });

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/stream
 * Stream a response from Claude
 *
 * Request body: Same as /chat
 * Response: Server-Sent Events (SSE) stream
 */
router.post('/stream', async (req, res, next) => {
  try {
    const {
      message,
      systemPrompt = null,
      maxTokens = 1024,
      temperature = 1,
      model = null
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Message is required and must be a string',
          code: 'INVALID_MESSAGE'
        }
      });
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await anthropic.streamMessage(message, {
      systemPrompt,
      maxTokens,
      temperature,
      model
    });

    let fullText = '';

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        const text = chunk.delta.text;
        fullText += text;
        res.write(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`);
      } else if (chunk.type === 'message_stop') {
        res.write(`data: ${JSON.stringify({ type: 'done', fullText })}\n\n`);
      }
    }

    res.end();
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/analyze
 * Analyze data with Claude
 *
 * Request body:
 * {
 *   "data": { ... } or "string data",  // Data to analyze (required)
 *   "analysisType": "summarize",       // Type: summarize, insights, questions, recommendations (optional)
 *   "maxTokens": 1024,                 // Max response tokens (optional)
 *   "model": "claude-3-5-sonnet-20241022" // Model to use (optional)
 * }
 */
router.post('/analyze', async (req, res, next) => {
  try {
    const {
      data,
      analysisType = 'summarize',
      maxTokens = 1024,
      model = null
    } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Data is required',
          code: 'MISSING_DATA'
        }
      });
    }

    const validTypes = ['summarize', 'insights', 'questions', 'recommendations'];
    if (!validTypes.includes(analysisType)) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Invalid analysis type. Must be one of: ${validTypes.join(', ')}`,
          code: 'INVALID_ANALYSIS_TYPE'
        }
      });
    }

    const response = await anthropic.analyzeData(data, analysisType, {
      maxTokens,
      model
    });

    res.json({
      success: true,
      analysisType,
      data: response
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/generate
 * Generate content based on a template
 *
 * Request body:
 * {
 *   "template": "Write a...",           // Content template/instructions (required)
 *   "data": { ... },                    // Context data (optional)
 *   "maxTokens": 1024,                  // Max response tokens (optional)
 *   "temperature": 1,                   // Response randomness (optional)
 *   "model": "claude-3-5-sonnet-20241022" // Model to use (optional)
 * }
 */
router.post('/generate', async (req, res, next) => {
  try {
    const {
      template,
      data = {},
      maxTokens = 1024,
      temperature = 1,
      model = null
    } = req.body;

    if (!template || typeof template !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Template is required and must be a string',
          code: 'INVALID_TEMPLATE'
        }
      });
    }

    const response = await anthropic.generateContent(template, data, {
      maxTokens,
      temperature,
      model
    });

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/data-insights
 * Combine Elasticsearch data with AI analysis
 *
 * Request body:
 * {
 *   "query": { ... },              // Elasticsearch query
 *   "index": "my-index",           // Index name (optional)
 *   "analysisType": "summarize",   // Analysis type (optional)
 *   "maxTokens": 2048              // Max response tokens (optional)
 * }
 */
router.post('/data-insights', async (req, res, next) => {
  try {
    const {
      query = { match_all: {} },
      index = null,
      analysisType = 'insights',
      maxTokens = 2048
    } = req.body;

    // First, get data from Elasticsearch
    const elasticsearch = require('../config/elasticsearch');
    const searchResults = await elasticsearch.search(index, query, 100); // Get up to 100 results

    if (searchResults.total === 0) {
      return res.json({
        success: true,
        message: 'No data found to analyze',
        data: null
      });
    }

    // Then, analyze with Claude
    const response = await anthropic.analyzeData(
      searchResults.hits,
      analysisType,
      { maxTokens }
    );

    res.json({
      success: true,
      dataCount: searchResults.total,
      analysisType,
      data: {
        analysis: response,
        summary: {
          totalDocuments: searchResults.total,
          analyzedDocuments: searchResults.hits.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
