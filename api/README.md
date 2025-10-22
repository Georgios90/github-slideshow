# GitHub Slideshow API

Backend API server for integrating Elasticsearch and Claude AI with the GitHub Slideshow presentation.

## Features

- **Elasticsearch Integration**: Search, index, and aggregate data
- **Claude AI Integration**: Chat, analyze data, generate content
- **RESTful API**: Clean, documented endpoints
- **Error Handling**: Comprehensive error responses
- **Security**: CORS, Helmet, optional API key authentication
- **Logging**: Request logging with Morgan

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env

# Start server
npm start
```

Server runs on http://localhost:3000

## Project Structure

```
api/
├── config/
│   ├── elasticsearch.js    # Elasticsearch client
│   └── anthropic.js         # Claude AI client
├── routes/
│   ├── data.js              # Data/Elasticsearch routes
│   └── ai.js                # AI/Claude routes
├── middleware/
│   ├── errorHandler.js      # Error handling
│   └── auth.js              # Authentication
├── server.js                # Main server file
├── package.json             # Dependencies
├── .env.example             # Environment template
└── README.md                # This file
```

## Environment Variables

Required:
```env
ELASTICSEARCH_CLOUD_ID=...     # or ELASTICSEARCH_HOST
ELASTICSEARCH_API_KEY=...      # or USERNAME + PASSWORD
ELASTICSEARCH_INDEX=...
ANTHROPIC_API_KEY=...
```

Optional:
```env
PORT=3000
NODE_ENV=development
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
API_KEY=...                    # For API authentication
ALLOWED_ORIGINS=...            # CORS origins (comma-separated)
```

## API Endpoints

### Health & Status

#### GET /health
Check API health status

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-10-22T...",
  "environment": "development"
}
```

#### GET /api/test-connections
Test Elasticsearch and Claude connections

**Response:**
```json
{
  "success": true,
  "connections": {
    "elasticsearch": { "connected": true, "status": "OK" },
    "anthropic": { "connected": true, "status": "OK" }
  }
}
```

### Data Endpoints (Elasticsearch)

#### POST /api/data/search
Search documents with custom Elasticsearch query

**Request:**
```json
{
  "query": { "match_all": {} },
  "index": "my-index",
  "size": 10,
  "from": 0
}
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "total": 42,
  "pagination": { "size": 10, "from": 0, "hasMore": true }
}
```

#### POST /api/data/full-text-search
Simple text search across fields

**Request:**
```json
{
  "q": "search query",
  "fields": ["title", "content"],
  "size": 20
}
```

#### GET /api/data/:id
Get document by ID

**Query params:** `?index=my-index` (optional)

#### POST /api/data/index
Index a new document

**Request:**
```json
{
  "document": { "title": "...", "content": "..." },
  "index": "my-index",
  "id": "optional-id"
}
```

#### POST /api/data/aggregate
Perform Elasticsearch aggregations

**Request:**
```json
{
  "aggregations": {
    "avg_score": { "avg": { "field": "score" } }
  },
  "index": "my-index"
}
```

### AI Endpoints (Claude)

#### POST /api/ai/chat
Chat with Claude

**Request:**
```json
{
  "message": "Hello Claude!",
  "systemPrompt": "You are a helpful assistant",
  "maxTokens": 1024,
  "temperature": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "msg_...",
    "content": "Hello! How can I help?",
    "usage": { "inputTokens": 10, "outputTokens": 15 }
  }
}
```

#### POST /api/ai/stream
Stream response from Claude (Server-Sent Events)

**Request:** Same as `/chat`

**Response:** SSE stream with chunks

#### POST /api/ai/analyze
Analyze data with Claude

**Request:**
```json
{
  "data": { "sales": [100, 150, 200] },
  "analysisType": "insights",
  "maxTokens": 1024
}
```

**Analysis types:**
- `summarize` - Concise summary
- `insights` - Key patterns and trends
- `questions` - Suggested questions
- `recommendations` - Actionable recommendations

#### POST /api/ai/generate
Generate content based on template

**Request:**
```json
{
  "template": "Write a product description for...",
  "data": { "product": "...", "features": [...] },
  "maxTokens": 1024
}
```

#### POST /api/ai/data-insights
Combine Elasticsearch data with AI analysis

**Request:**
```json
{
  "query": { "match_all": {} },
  "analysisType": "insights",
  "maxTokens": 2048
}
```

## Authentication (Optional)

Set `API_KEY` in `.env` to enable authentication:

```env
API_KEY=your-secret-key
```

Include in requests:
```bash
curl -H "x-api-key: your-secret-key" http://localhost:3000/api/data/search
```

Or as query parameter:
```
http://localhost:3000/api/data/search?api_key=your-secret-key
```

## Error Handling

All errors return:
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

Common error codes:
- `MISSING_API_KEY` - API key required
- `INVALID_API_KEY` - Invalid API key
- `NOT_FOUND` - Resource not found
- `INVALID_DOCUMENT` - Invalid document format
- `INTERNAL_ERROR` - Server error

## Development

### Start with auto-restart
```bash
npm run dev
```

### Run tests
```bash
npm test
```

## Production Deployment

### Set environment
```bash
export NODE_ENV=production
```

### Use process manager
```bash
pm2 start server.js --name slideshow-api
```

### Or Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## Dependencies

- **@elastic/elasticsearch** (^8.15.0) - Elasticsearch client
- **@anthropic-ai/sdk** (^0.30.0) - Claude AI SDK
- **express** (^4.21.1) - Web framework
- **dotenv** (^16.4.5) - Environment variables
- **cors** (^2.8.5) - CORS middleware
- **morgan** (^1.10.0) - Request logger
- **helmet** (^8.0.0) - Security headers

## License

MIT

## Support

See [DATA_INTEGRATION_SETUP.md](../DATA_INTEGRATION_SETUP.md) for detailed setup guide.
