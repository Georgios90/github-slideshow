const Anthropic = require('@anthropic-ai/sdk');

/**
 * Anthropic (Claude) API Client Configuration
 *
 * Provides a configured client for interacting with Claude AI models
 */

let client = null;

/**
 * Initialize Anthropic client
 * @returns {Anthropic} Anthropic client instance
 */
function initAnthropicClient() {
  if (client) {
    return client;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      'Anthropic API key missing. Please set ANTHROPIC_API_KEY in your .env file'
    );
  }

  client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  console.log('Anthropic client initialized');
  return client;
}

/**
 * Get Anthropic client instance
 * @returns {Anthropic} Anthropic client instance
 */
function getClient() {
  if (!client) {
    return initAnthropicClient();
  }
  return client;
}

/**
 * Send a message to Claude and get a response
 * @param {string} userMessage - The user's message/prompt
 * @param {object} options - Additional options
 * @param {string} options.systemPrompt - System prompt to set context
 * @param {number} options.maxTokens - Maximum tokens in response (default: 1024)
 * @param {string} options.model - Claude model to use (default: from env)
 * @param {number} options.temperature - Response randomness 0-1 (default: 1)
 * @returns {Promise<object>} Claude's response
 */
async function sendMessage(userMessage, options = {}) {
  try {
    const client = getClient();
    const {
      systemPrompt = null,
      maxTokens = 1024,
      model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      temperature = 1
    } = options;

    const messageParams = {
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ]
    };

    if (systemPrompt) {
      messageParams.system = systemPrompt;
    }

    const response = await client.messages.create(messageParams);

    return {
      id: response.id,
      model: response.model,
      role: response.role,
      content: response.content[0].text,
      stopReason: response.stop_reason,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens
      }
    };
  } catch (error) {
    console.error('Anthropic API error:', error.message);
    throw error;
  }
}

/**
 * Stream a response from Claude
 * @param {string} userMessage - The user's message/prompt
 * @param {object} options - Additional options (same as sendMessage)
 * @returns {Promise<AsyncGenerator>} Stream of response chunks
 */
async function streamMessage(userMessage, options = {}) {
  try {
    const client = getClient();
    const {
      systemPrompt = null,
      maxTokens = 1024,
      model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      temperature = 1
    } = options;

    const messageParams = {
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ],
      stream: true
    };

    if (systemPrompt) {
      messageParams.system = systemPrompt;
    }

    const stream = await client.messages.create(messageParams);
    return stream;
  } catch (error) {
    console.error('Anthropic API streaming error:', error.message);
    throw error;
  }
}

/**
 * Analyze data with Claude
 * @param {object} data - Data to analyze
 * @param {string} analysisType - Type of analysis to perform
 * @param {object} options - Additional options
 * @returns {Promise<object>} Analysis results
 */
async function analyzeData(data, analysisType = 'summarize', options = {}) {
  try {
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

    const prompts = {
      summarize: `Please provide a concise summary of the following data:\n\n${dataStr}`,
      insights: `Analyze the following data and provide key insights, patterns, and trends:\n\n${dataStr}`,
      questions: `Based on the following data, suggest relevant questions that could be asked:\n\n${dataStr}`,
      recommendations: `Based on the following data, provide actionable recommendations:\n\n${dataStr}`
    };

    const prompt = prompts[analysisType] || prompts.summarize;

    return await sendMessage(prompt, {
      ...options,
      systemPrompt: 'You are a data analyst assistant. Provide clear, accurate, and actionable insights.'
    });
  } catch (error) {
    console.error('Data analysis error:', error.message);
    throw error;
  }
}

/**
 * Generate content based on a template
 * @param {string} template - Content template/instructions
 * @param {object} data - Data to use in generation
 * @param {object} options - Additional options
 * @returns {Promise<object>} Generated content
 */
async function generateContent(template, data = {}, options = {}) {
  try {
    const dataContext = Object.keys(data).length > 0
      ? `\n\nContext data:\n${JSON.stringify(data, null, 2)}`
      : '';

    const prompt = `${template}${dataContext}`;

    return await sendMessage(prompt, {
      ...options,
      systemPrompt: 'You are a helpful content generation assistant.'
    });
  } catch (error) {
    console.error('Content generation error:', error.message);
    throw error;
  }
}

/**
 * Test Anthropic API connection
 * @returns {Promise<boolean>} Connection status
 */
async function testConnection() {
  try {
    const response = await sendMessage('Hello! Please respond with "OK" to confirm the connection.', {
      maxTokens: 10
    });
    console.log('Anthropic API connection successful');
    return true;
  } catch (error) {
    console.error('Anthropic API connection failed:', error.message);
    return false;
  }
}

module.exports = {
  initAnthropicClient,
  getClient,
  sendMessage,
  streamMessage,
  analyzeData,
  generateContent,
  testConnection
};
