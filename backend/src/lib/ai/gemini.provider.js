/**
 * src/lib/ai/gemini.provider.js
 *
 * AI provider implementation for Google Gemini API.
 * Supports chat and text embedding generation.
 * @extends BaseAIProvider
 */

import { BaseAIProvider } from './base.provider.js';

export class GeminiProvider extends BaseAIProvider {
  /**
   * @param {object} config - Provider configuration
   * @param {string} [config.apiKey] - Gemini API key
   * @param {string} [config.model] - Chat model name
   * @param {string} [config.embeddingModel] - Embedding model name
   */
  constructor(config = {}) {
    super(config);
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY;
    this.model = config.model || process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';
    this.embeddingModel = config.embeddingModel || process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  /**
   * Send chat messages to Gemini and get a response
   * @param {Array<{role: string, content: string}>} messages - Chat messages
   * @param {object} options - Chat options
   * @param {number} [options.temperature=0.7] - Response randomness
   * @param {number} [options.maxTokens=1024] - Maximum output tokens
   * @param {string} [options.context=''] - Additional context for system prompt
   * @returns {Promise<{content: string, usage: object, model: string}>}
   */
  async chat(messages, options = {}) {
    const { temperature = 0.7, maxTokens = 1024, context = '' } = options;

    if (typeof fetch === 'undefined') {
      throw new Error('Global fetch is not defined. Please upgrade to Node.js 18+ or provide a polyfill.');
    }

    // Convert to Gemini format
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Add system instruction
    let systemPrompt = this.getSystemPrompt();
    if (context) {
      systemPrompt += `\n\n${context}`;
    }

    const systemInstruction = {
      parts: [{ text: systemPrompt }]
    };

    const response = await fetch(
      `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents,
          systemInstruction,
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Gemini API error');
    }

    const data = await response.json();
    return {
      content: data.candidates[0].content.parts[0].text,
      usage: data.usageMetadata,
      model: this.model
    };
  }

  /**
   * Generate a text embedding vector using Gemini Embedding API
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} Embedding vector
   */
  async generateEmbedding(text) {
    if (typeof fetch === 'undefined') {
      throw new Error('Global fetch is not defined. Please upgrade to Node.js 18+ or provide a polyfill.');
    }

    const response = await fetch(
      `${this.baseUrl}/models/${this.embeddingModel}:embedContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: `models/${this.embeddingModel}`,
          content: {
            parts: [{ text }]
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Gemini Embedding API error');
    }

    const data = await response.json();
    return data.embedding.values;
  }
}
