# Data Integration Setup Guide

This guide will help you set up real data integration with Elasticsearch and Claude AI for the GitHub Slideshow project.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend API Setup](#backend-api-setup)
3. [Elasticsearch Configuration](#elasticsearch-configuration)
4. [Claude API Configuration](#claude-api-configuration)
5. [Running the API Server](#running-the-api-server)
6. [Frontend Integration](#frontend-integration)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js** (v14 or higher) installed
- **npm** or **yarn** package manager
- **Elasticsearch** instance (Cloud or self-hosted)
- **Anthropic API key** for Claude
- Basic knowledge of REST APIs and JavaScript

---

## Backend API Setup

### 1. Install Dependencies

Navigate to the `api` directory and install dependencies:

```bash
cd api
npm install
```

This will install:
- `@elastic/elasticsearch` - Elasticsearch client
- `@anthropic-ai/sdk` - Claude API SDK
- `express` - Web framework
- `dotenv` - Environment variables
- `cors` - Cross-Origin Resource Sharing
- `morgan` - HTTP request logger
- `helmet` - Security headers

### 2. Create Environment File

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your actual credentials (see next sections).

---

## Elasticsearch Configuration

You have two options for connecting to Elasticsearch:

### Option 1: Elastic Cloud (Recommended)

1. **Sign up for Elastic Cloud**: https://cloud.elastic.co/
2. **Create a deployment** or use an existing one
3. **Get your Cloud ID**:
   - Go to your deployment
   - Click "Manage"
   - Copy the Cloud ID

4. **Create an API Key**:
   - Go to Kibana → Stack Management → Security → API Keys
   - Click "Create API key"
   - Give it a name (e.g., "slideshow-api")
   - Set appropriate permissions
   - Copy the API key (you won't see it again!)

5. **Update `.env`**:
   ```env
   ELASTICSEARCH_CLOUD_ID=your_cloud_id_here
   ELASTICSEARCH_API_KEY=your_api_key_here
   ELASTICSEARCH_INDEX=your_index_name
   ```

### Option 2: Self-Hosted Elasticsearch

1. **Install and run Elasticsearch locally** or use a remote instance
2. **Update `.env`**:
   ```env
   ELASTICSEARCH_HOST=https://localhost:9200
   ELASTICSEARCH_USERNAME=elastic
   ELASTICSEARCH_PASSWORD=your_password
   ELASTICSEARCH_INDEX=your_index_name
   ```

### Create an Index

Before using the API, create an index in Elasticsearch:

**Using Kibana Dev Tools:**
```json
PUT /your_index_name
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1
  },
  "mappings": {
    "properties": {
      "title": { "type": "text" },
      "description": { "type": "text" },
      "content": { "type": "text" },
      "timestamp": { "type": "date" }
    }
  }
}
```

**Or using the API:**
```bash
curl -X PUT "localhost:9200/your_index_name" -H 'Content-Type: application/json' -d'
{
  "settings": { "number_of_shards": 1 },
  "mappings": {
    "properties": {
      "title": { "type": "text" },
      "description": { "type": "text" },
      "content": { "type": "text" }
    }
  }
}
'
```

---

## Claude API Configuration

### 1. Get an API Key

1. **Sign up for Anthropic**: https://www.anthropic.com/
2. **Get your API key**:
   - Go to https://console.anthropic.com/
   - Navigate to API Keys
   - Create a new key
   - Copy it immediately

### 2. Update `.env`

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

Available models:
- `claude-3-5-sonnet-20241022` (Recommended - best balance)
- `claude-3-opus-20240229` (Most capable)
- `claude-3-sonnet-20240229` (Fast)
- `claude-3-haiku-20240307` (Fastest, most cost-effective)

---

## Running the API Server

### Development Mode

Start the server with auto-restart on file changes:

```bash
cd api
npm run dev
```

Or without nodemon:

```bash
cd api
npm start
```

### Production Mode

```bash
cd api
NODE_ENV=production npm start
```

The server will start on **http://localhost:3000** (or the port specified in `.env`).

### Verify Server is Running

Open your browser or use curl:

```bash
curl http://localhost:3000/health
```

Should return:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-10-22T...",
  "environment": "development"
}
```

### Test Connections

```bash
curl http://localhost:3000/api/test-connections
```

Should return connection status for both Elasticsearch and Claude.

---

## Frontend Integration

The frontend API client is already integrated into the slideshow via `assets/js/api-client.js`.

### Using the API Client

The `APIClient` class is globally available in your slides. Here's how to use it:

#### 1. Initialize the Client

```javascript
// In your custom slide JavaScript
const api = new APIClient('http://localhost:3000');

// Optional: Set API key if you configured authentication
api.setApiKey('your-api-key');
```

#### 2. Search Data

```javascript
async function loadData() {
  try {
    const results = await api.searchData(
      { match_all: {} },  // Query
      { size: 10, from: 0 }  // Options
    );

    console.log('Data:', results.data);
    // Display in your slide
  } catch (error) {
    console.error('Error:', error);
  }
}
```

#### 3. Full-Text Search

```javascript
async function search(query) {
  const results = await api.fullTextSearch(query, {
    fields: ['title', 'content'],
    size: 20
  });

  // Display results
  displayResults(results.data);
}
```

#### 4. Chat with Claude

```javascript
async function askClaude(question) {
  const response = await api.chatWithAI(question, {
    maxTokens: 1024
  });

  console.log('Claude says:', response.data.content);
}
```

#### 5. Get AI Insights from Data

```javascript
async function getInsights() {
  const insights = await api.getDataInsights(
    { match_all: {} },
    { analysisType: 'insights' }
  );

  // Display insights in slide
  displayInsights(insights.data.analysis.content);
}
```

### Example: Load Data into a Slide

Create a new slide in `_posts/`:

```markdown
---
layout: slide
---

<section data-id="data-slide">
  <h2>Loading data...</h2>
</section>

<script>
document.addEventListener('DOMContentLoaded', async () => {
  const api = new APIClient('http://localhost:3000');

  try {
    const results = await api.searchData({ match_all: {} }, { size: 5 });

    const slideElement = document.querySelector('[data-id="data-slide"]');
    slideElement.innerHTML = `
      <h2>Latest Data</h2>
      <ul>
        ${results.data.map(item => `
          <li>${item.title || 'Untitled'}</li>
        `).join('')}
      </ul>
    `;
  } catch (error) {
    console.error('Failed to load data:', error);
  }
});
</script>
```

---

## Testing

### 1. Test Health Endpoint

```bash
curl http://localhost:3000/health
```

### 2. Test Connections

```bash
curl http://localhost:3000/api/test-connections
```

### 3. Test Elasticsearch Search

```bash
curl -X POST http://localhost:3000/api/data/search \
  -H "Content-Type: application/json" \
  -d '{"query": {"match_all": {}}}'
```

### 4. Test Claude Chat

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Claude!"}'
```

### 5. Test Full Integration

```bash
curl -X POST http://localhost:3000/api/ai/data-insights \
  -H "Content-Type: application/json" \
  -d '{"query": {"match_all": {}}, "analysisType": "summarize"}'
```

---

## Troubleshooting

### Elasticsearch Connection Issues

**Problem:** `Elasticsearch connection failed`

**Solutions:**
1. Verify your credentials in `.env`
2. Check if Elasticsearch is running
3. Test connection directly:
   ```bash
   curl -u elastic:password https://localhost:9200
   ```
4. Check firewall/network settings
5. Verify Cloud ID format (if using Elastic Cloud)

### Claude API Issues

**Problem:** `Anthropic API error`

**Solutions:**
1. Verify API key is correct in `.env`
2. Check your API quota/billing
3. Ensure API key has not expired
4. Check Anthropic status: https://status.anthropic.com/

### CORS Errors

**Problem:** Browser shows CORS errors

**Solutions:**
1. Add your frontend URL to `ALLOWED_ORIGINS` in `.env`:
   ```env
   ALLOWED_ORIGINS=http://localhost:4000,https://yourdomain.com
   ```
2. Restart the API server

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions:**
1. Change the port in `.env`:
   ```env
   PORT=3001
   ```
2. Or kill the process using port 3000:
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

### Module Not Found Errors

**Problem:** `Cannot find module '@elastic/elasticsearch'`

**Solution:**
```bash
cd api
rm -rf node_modules package-lock.json
npm install
```

---

## API Endpoints Reference

### Health & Status
- `GET /health` - Health check
- `GET /api/test-connections` - Test all connections

### Data (Elasticsearch)
- `POST /api/data/search` - Search with custom query
- `POST /api/data/full-text-search` - Simple text search
- `GET /api/data/:id` - Get document by ID
- `POST /api/data/index` - Index a document
- `POST /api/data/aggregate` - Perform aggregations

### AI (Claude)
- `POST /api/ai/chat` - Chat with Claude
- `POST /api/ai/stream` - Stream Claude response (SSE)
- `POST /api/ai/analyze` - Analyze data with AI
- `POST /api/ai/generate` - Generate content
- `POST /api/ai/data-insights` - Get AI insights from Elasticsearch data

---

## Next Steps

1. **Populate your Elasticsearch index** with real data
2. **Customize the API** routes for your specific use case
3. **Create custom slides** that fetch and display data
4. **Add authentication** if needed (set `API_KEY` in `.env`)
5. **Deploy to production** (consider using services like Heroku, Render, or Railway)

---

## Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review example usage in `assets/js/example-usage.js`
- Check Elasticsearch docs: https://www.elastic.co/guide/
- Check Anthropic docs: https://docs.anthropic.com/

---

**Happy coding!**
