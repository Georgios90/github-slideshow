# Quick Start Guide

Get your data integration up and running in 5 minutes!

## Prerequisites

- Node.js (v14+)
- Elasticsearch instance (or Elastic Cloud account)
- Anthropic API key

---

## Step 1: Install Backend Dependencies

```bash
cd api
npm install
```

---

## Step 2: Configure Environment Variables

Create your `.env` file:

```bash
cd api
cp .env.example .env
```

Edit `api/.env` with your credentials:

```env
# Server
PORT=3000

# Elasticsearch (choose one method)
ELASTICSEARCH_CLOUD_ID=your_cloud_id
ELASTICSEARCH_API_KEY=your_api_key
ELASTICSEARCH_INDEX=slideshow-data

# Claude API
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

---

## Step 3: Start the API Server

```bash
cd api
npm start
```

You should see:
```
✓ Elasticsearch connection successful
✓ Anthropic client initialized

  GitHub Slideshow API Server
  Status: Running
  Port: 3000
  URL: http://localhost:3000
```

---

## Step 4: Test the API

Open a new terminal and run:

```bash
# Test health
curl http://localhost:3000/health

# Test connections
curl http://localhost:3000/api/test-connections

# Test Elasticsearch search
curl -X POST http://localhost:3000/api/data/search \
  -H "Content-Type: application/json" \
  -d '{"query": {"match_all": {}}}'

# Test Claude chat
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

---

## Step 5: Use in Frontend

The API client is already loaded in your slideshow. Open browser console and try:

```javascript
const api = new APIClient('http://localhost:3000');

// Test connection
await api.checkHealth();

// Search data
const results = await api.searchData({ match_all: {} });
console.log(results);

// Chat with Claude
const response = await api.chatWithAI('Explain quantum computing');
console.log(response.data.content);
```

---

## Common Issues

### "Elasticsearch connection failed"
- Verify credentials in `.env`
- Make sure Elasticsearch is running
- Check network/firewall settings

### "Anthropic API error"
- Check API key is correct
- Verify you have API credits
- Visit https://console.anthropic.com/

### "CORS errors in browser"
- Make sure API server is running
- Check browser console for actual error
- Add your frontend URL to `ALLOWED_ORIGINS` in `.env`

---

## Next Steps

1. Read the full [DATA_INTEGRATION_SETUP.md](./DATA_INTEGRATION_SETUP.md)
2. Check example usage in `assets/js/example-usage.js`
3. Create custom slides that use the API
4. Populate your Elasticsearch index with real data

---

**You're all set!** The API is ready to use.
