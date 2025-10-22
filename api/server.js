require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { optionalAuth } = require('./middleware/auth');

const dataRoutes = require('./routes/data');
const aiRoutes = require('./routes/ai');

const elasticsearch = require('./config/elasticsearch');
const anthropic = require('./config/anthropic');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')); // Logging

// Optional authentication middleware
app.use(optionalAuth);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API info endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'GitHub Slideshow API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      data: {
        search: 'POST /api/data/search',
        getById: 'GET /api/data/:id',
        index: 'POST /api/data/index',
        aggregate: 'POST /api/data/aggregate'
      },
      ai: {
        chat: 'POST /api/ai/chat',
        stream: 'POST /api/ai/stream',
        analyze: 'POST /api/ai/analyze',
        generate: 'POST /api/ai/generate'
      }
    }
  });
});

// Test connections endpoint
app.get('/api/test-connections', async (req, res) => {
  try {
    const [esConnected, aiConnected] = await Promise.all([
      elasticsearch.testConnection(),
      anthropic.testConnection()
    ]);

    res.json({
      success: true,
      connections: {
        elasticsearch: {
          connected: esConnected,
          status: esConnected ? 'OK' : 'Failed'
        },
        anthropic: {
          connected: aiConnected,
          status: aiConnected ? 'OK' : 'Failed'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to test connections',
        details: error.message
      }
    });
  }
});

// API Routes
app.use('/api/data', dataRoutes);
app.use('/api/ai', aiRoutes);

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize connections and start server
async function startServer() {
  try {
    console.log('Starting GitHub Slideshow API...');

    // Initialize Elasticsearch
    try {
      elasticsearch.initElasticsearchClient();
      const esConnected = await elasticsearch.testConnection();
      if (esConnected) {
        console.log('✓ Elasticsearch connection successful');
      } else {
        console.warn('⚠ Elasticsearch connection failed - some features may not work');
      }
    } catch (error) {
      console.warn('⚠ Elasticsearch initialization failed:', error.message);
    }

    // Initialize Anthropic
    try {
      anthropic.initAnthropicClient();
      console.log('✓ Anthropic client initialized');
    } catch (error) {
      console.warn('⚠ Anthropic initialization failed:', error.message);
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log('');
      console.log('='.repeat(50));
      console.log(`  GitHub Slideshow API Server`);
      console.log('='.repeat(50));
      console.log(`  Status: Running`);
      console.log(`  Port: ${PORT}`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  URL: http://localhost:${PORT}`);
      console.log('='.repeat(50));
      console.log('');
      console.log('Available endpoints:');
      console.log(`  GET  /health - Health check`);
      console.log(`  GET  /api/test-connections - Test API connections`);
      console.log(`  POST /api/data/search - Search Elasticsearch`);
      console.log(`  POST /api/ai/chat - Chat with Claude`);
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
