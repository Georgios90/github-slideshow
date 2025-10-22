# Your GitHub Learning Lab Repository for Introducing GitHub

Welcome to **your** repository for your GitHub Learning Lab course. This repository will be used during the different activities that I will be guiding you through. See a word you don't understand? We've included an emoji 📖 next to some key terms. Click on it to see its definition.

Oh! I haven't introduced myself...

I'm the GitHub Learning Lab bot and I'm here to help guide you in your journey to learn and master the various topics covered in this course. I will be using Issue and Pull Request comments to communicate with you. In fact, I already added an issue for you to check out.

![issue tab](https://lab.github.com/public/images/issue_tab.png)

I'll meet you over there, can't wait to get started!

This course is using the :sparkles: open source project [reveal.js](https://github.com/hakimel/reveal.js/). In some cases we've made changes to the history so it would behave during class, so head to the original project repo to learn more about the cool people behind this project.

---

## Data Integration

This repository now includes a powerful backend API for integrating real data from Elasticsearch and AI capabilities from Claude (Anthropic).

### Features

- **Elasticsearch Integration**: Search, index, and analyze your data
- **Claude AI Integration**: Chat, analyze data, generate insights
- **RESTful API**: Clean, well-documented endpoints
- **Frontend Client**: Ready-to-use JavaScript API client

### Quick Start

1. **Install backend dependencies**:
   ```bash
   cd api
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp api/.env.example api/.env
   # Edit api/.env with your Elasticsearch and Anthropic API credentials
   ```

3. **Start the API server**:
   ```bash
   cd api
   npm start
   ```

4. **Use in your slides**: The API client is automatically available in all slides!

### Documentation

- **[Quick Start Guide](./QUICKSTART.md)** - Get running in 5 minutes
- **[Complete Setup Guide](./DATA_INTEGRATION_SETUP.md)** - Detailed configuration and usage
- **[API Documentation](./api/README.md)** - Full API reference

### Example Usage

```javascript
// In your slide JavaScript
const api = new APIClient('http://localhost:3000');

// Search your data
const results = await api.searchData({ match_all: {} });

// Chat with Claude
const response = await api.chatWithAI('Analyze this data...');

// Get AI insights from your data
const insights = await api.getDataInsights({ match_all: {} });
```

See `assets/js/example-usage.js` for more examples.
