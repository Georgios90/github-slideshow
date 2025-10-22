/**
 * Example Usage of API Client
 *
 * This file demonstrates how to use the API client
 * to fetch data from Elasticsearch and interact with Claude AI
 */

// Initialize the API client
// Change the URL to match your API server
const api = new APIClient('http://localhost:3000');

// Optional: Set API key if authentication is required
// api.setApiKey('your-api-key-here');

/**
 * Example 1: Check API Health and Connections
 */
async function checkAPIStatus() {
  try {
    const health = await api.checkHealth();
    console.log('API Health:', health);

    const connections = await api.testConnections();
    console.log('Connections:', connections);

    // Display status on page
    displayStatus(connections);
  } catch (error) {
    console.error('Failed to check API status:', error);
    displayError('API is not available');
  }
}

/**
 * Example 2: Search Data from Elasticsearch
 */
async function searchForData() {
  try {
    // Simple match-all query
    const results = await api.searchData({ match_all: {} }, {
      size: 10,
      from: 0
    });

    console.log('Search results:', results);
    displaySearchResults(results.data);
  } catch (error) {
    console.error('Search failed:', error);
  }
}

/**
 * Example 3: Full-Text Search
 */
async function performFullTextSearch(searchQuery) {
  try {
    const results = await api.fullTextSearch(searchQuery, {
      fields: ['title', 'description', 'content'],
      size: 20
    });

    console.log('Full-text search results:', results);
    displaySearchResults(results.data);
  } catch (error) {
    console.error('Full-text search failed:', error);
  }
}

/**
 * Example 4: Get Data Insights with AI
 */
async function getInsightsFromData() {
  try {
    // Get data and analyze it with Claude
    const insights = await api.getDataInsights(
      { match_all: {} },
      {
        analysisType: 'insights',
        maxTokens: 2048
      }
    );

    console.log('AI Insights:', insights);
    displayAIInsights(insights.data.analysis);
  } catch (error) {
    console.error('Failed to get insights:', error);
  }
}

/**
 * Example 5: Chat with Claude
 */
async function chatWithClaude(userMessage) {
  try {
    const response = await api.chatWithAI(userMessage, {
      systemPrompt: 'You are a helpful data analysis assistant.',
      maxTokens: 1024
    });

    console.log('Claude response:', response);
    displayChatMessage('Claude', response.data.content);
  } catch (error) {
    console.error('Chat failed:', error);
  }
}

/**
 * Example 6: Stream AI Response
 */
async function streamChatResponse(userMessage) {
  try {
    const responseDiv = document.getElementById('streaming-response');
    responseDiv.innerHTML = '';

    await api.streamAI(
      userMessage,
      {
        maxTokens: 1024
      },
      (chunk) => {
        // This callback is called for each chunk of the response
        responseDiv.innerHTML += chunk;
      }
    );

    console.log('Streaming complete');
  } catch (error) {
    console.error('Streaming failed:', error);
  }
}

/**
 * Example 7: Analyze Specific Data
 */
async function analyzeMyData() {
  try {
    const myData = {
      sales: [100, 150, 200, 180, 220],
      products: ['Product A', 'Product B', 'Product C'],
      region: 'North America'
    };

    const analysis = await api.analyzeDataWithAI(myData, 'insights', {
      maxTokens: 1024
    });

    console.log('Data analysis:', analysis);
    displayAIInsights(analysis.data);
  } catch (error) {
    console.error('Analysis failed:', error);
  }
}

/**
 * Example 8: Fetch and Display Data on Reveal.js Slide
 */
async function loadDataIntoSlide() {
  try {
    // Search for data
    const results = await api.searchData({ match_all: {} }, { size: 5 });

    if (results.success && results.data.length > 0) {
      // Create HTML for the slide
      const dataHTML = results.data.map(item => `
        <div class="data-item">
          <h3>${item.title || 'Untitled'}</h3>
          <p>${item.description || 'No description'}</p>
        </div>
      `).join('');

      // Find a slide element and update its content
      const slideElement = document.querySelector('[data-id="data-slide"]');
      if (slideElement) {
        slideElement.innerHTML = `
          <h2>Latest Data</h2>
          <div class="data-container">
            ${dataHTML}
          </div>
        `;
      }
    }
  } catch (error) {
    console.error('Failed to load data into slide:', error);
  }
}

// ========== Helper Functions for Display ==========

function displayStatus(connections) {
  const statusDiv = document.getElementById('api-status');
  if (!statusDiv) return;

  const esStatus = connections.connections?.elasticsearch?.connected ? '✓' : '✗';
  const aiStatus = connections.connections?.anthropic?.connected ? '✓' : '✗';

  statusDiv.innerHTML = `
    <div class="status">
      <p>Elasticsearch: ${esStatus} ${connections.connections?.elasticsearch?.status}</p>
      <p>Claude AI: ${aiStatus} ${connections.connections?.anthropic?.status}</p>
    </div>
  `;
}

function displaySearchResults(results) {
  const resultsDiv = document.getElementById('search-results');
  if (!resultsDiv) return;

  resultsDiv.innerHTML = results.map(item => `
    <div class="result-item">
      <pre>${JSON.stringify(item, null, 2)}</pre>
    </div>
  `).join('');
}

function displayAIInsights(insights) {
  const insightsDiv = document.getElementById('ai-insights');
  if (!insightsDiv) return;

  insightsDiv.innerHTML = `
    <div class="insights">
      <p>${insights.content || JSON.stringify(insights)}</p>
    </div>
  `;
}

function displayChatMessage(sender, message) {
  const chatDiv = document.getElementById('chat-messages');
  if (!chatDiv) return;

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender.toLowerCase()}`;
  messageDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
  chatDiv.appendChild(messageDiv);
}

function displayError(message) {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.innerHTML = `<div class="error">${message}</div>`;
  }
  console.error(message);
}

// ========== Initialize on Page Load ==========

document.addEventListener('DOMContentLoaded', () => {
  console.log('API Client ready');

  // Check API status on load
  checkAPIStatus();

  // Example: Set up event listeners for UI elements
  const searchButton = document.getElementById('search-button');
  if (searchButton) {
    searchButton.addEventListener('click', () => {
      const query = document.getElementById('search-input').value;
      performFullTextSearch(query);
    });
  }

  const chatButton = document.getElementById('chat-button');
  if (chatButton) {
    chatButton.addEventListener('click', () => {
      const message = document.getElementById('chat-input').value;
      chatWithClaude(message);
    });
  }

  const insightsButton = document.getElementById('insights-button');
  if (insightsButton) {
    insightsButton.addEventListener('click', () => {
      getInsightsFromData();
    });
  }
});
