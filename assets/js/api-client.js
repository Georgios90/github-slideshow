/**
 * API Client for GitHub Slideshow
 *
 * Provides methods to interact with the backend API
 * for Elasticsearch data retrieval and Claude AI integration
 */

class APIClient {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.apiKey = null; // Set if API requires authentication
  }

  /**
   * Set API key for authentication
   * @param {string} key - API key
   */
  setApiKey(key) {
    this.apiKey = key;
  }

  /**
   * Make a request to the API
   * @param {string} endpoint - API endpoint
   * @param {object} options - Fetch options
   * @returns {Promise<object>} Response data
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `API error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // ========== Health & Connection ==========

  /**
   * Check API health
   * @returns {Promise<object>} Health status
   */
  async checkHealth() {
    return this.request('/health');
  }

  /**
   * Test API connections (Elasticsearch & Claude)
   * @returns {Promise<object>} Connection status
   */
  async testConnections() {
    return this.request('/api/test-connections');
  }

  // ========== Data (Elasticsearch) Methods ==========

  /**
   * Search Elasticsearch
   * @param {object} query - Elasticsearch query
   * @param {object} options - Search options
   * @returns {Promise<object>} Search results
   */
  async searchData(query = { match_all: {} }, options = {}) {
    return this.request('/api/data/search', {
      method: 'POST',
      body: JSON.stringify({
        query,
        ...options
      })
    });
  }

  /**
   * Full-text search
   * @param {string} searchQuery - Search query string
   * @param {object} options - Search options
   * @returns {Promise<object>} Search results
   */
  async fullTextSearch(searchQuery, options = {}) {
    return this.request('/api/data/full-text-search', {
      method: 'POST',
      body: JSON.stringify({
        q: searchQuery,
        ...options
      })
    });
  }

  /**
   * Get document by ID
   * @param {string} id - Document ID
   * @param {string} index - Index name (optional)
   * @returns {Promise<object>} Document data
   */
  async getDataById(id, index = null) {
    const query = index ? `?index=${encodeURIComponent(index)}` : '';
    return this.request(`/api/data/${id}${query}`);
  }

  /**
   * Index a new document
   * @param {object} document - Document to index
   * @param {object} options - Index options
   * @returns {Promise<object>} Index result
   */
  async indexData(document, options = {}) {
    return this.request('/api/data/index', {
      method: 'POST',
      body: JSON.stringify({
        document,
        ...options
      })
    });
  }

  /**
   * Perform aggregations
   * @param {object} aggregations - Elasticsearch aggregations
   * @param {string} index - Index name (optional)
   * @returns {Promise<object>} Aggregation results
   */
  async aggregateData(aggregations, index = null) {
    return this.request('/api/data/aggregate', {
      method: 'POST',
      body: JSON.stringify({
        aggregations,
        index
      })
    });
  }

  // ========== AI (Claude) Methods ==========

  /**
   * Chat with Claude
   * @param {string} message - User message
   * @param {object} options - Chat options
   * @returns {Promise<object>} Claude's response
   */
  async chatWithAI(message, options = {}) {
    return this.request('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        ...options
      })
    });
  }

  /**
   * Stream response from Claude (SSE)
   * @param {string} message - User message
   * @param {object} options - Chat options
   * @param {function} onChunk - Callback for each chunk
   * @returns {Promise<string>} Full response text
   */
  async streamAI(message, options = {}, onChunk = null) {
    const url = `${this.baseURL}/api/ai/stream`;
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`Stream request failed: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'text') {
              fullText += data.content;
              if (onChunk) onChunk(data.content);
            } else if (data.type === 'done') {
              return data.fullText;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullText;
  }

  /**
   * Analyze data with Claude
   * @param {object|string} data - Data to analyze
   * @param {string} analysisType - Type of analysis (summarize, insights, questions, recommendations)
   * @param {object} options - Analysis options
   * @returns {Promise<object>} Analysis results
   */
  async analyzeDataWithAI(data, analysisType = 'summarize', options = {}) {
    return this.request('/api/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({
        data,
        analysisType,
        ...options
      })
    });
  }

  /**
   * Generate content with Claude
   * @param {string} template - Content template/instructions
   * @param {object} data - Context data
   * @param {object} options - Generation options
   * @returns {Promise<object>} Generated content
   */
  async generateContent(template, data = {}, options = {}) {
    return this.request('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({
        template,
        data,
        ...options
      })
    });
  }

  /**
   * Get AI insights from Elasticsearch data
   * @param {object} query - Elasticsearch query
   * @param {object} options - Options
   * @returns {Promise<object>} Data insights
   */
  async getDataInsights(query = { match_all: {} }, options = {}) {
    return this.request('/api/ai/data-insights', {
      method: 'POST',
      body: JSON.stringify({
        query,
        ...options
      })
    });
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIClient;
}
