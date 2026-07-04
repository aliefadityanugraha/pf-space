/**
 * src/lib/ai/groq.provider.js
 *
 * AI provider implementation for Groq API (LLaMA models).
 * @extends BaseAIProvider
 */

import { BaseAIProvider } from './base.provider.js';

export class GroqProvider extends BaseAIProvider {
  /**
   * @param {object} config - Provider configuration
   * @param {string} [config.apiKey] - Groq API key
   * @param {string} [config.model] - Model name
   */
  constructor(config = {}) {
    super(config);
    this.apiKey = config.apiKey || process.env.GROQ_API_KEY;
    this.model = config.model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    this.baseUrl = 'https://api.groq.com/openai/v1';
  }

  /**
   * Send chat messages to Groq and get a response
   * @param {Array<{role: string, content: string}>} messages - Chat messages
   * @param {object} options - Chat options
   * @param {number} [options.temperature=0.7] - Response randomness
   * @param {number} [options.maxTokens=1024] - Maximum output tokens
   * @param {string} [options.context=''] - Additional context for system prompt
   * @returns {Promise<{content: string, usage: object, model: string}>}
   */
  async chat(messages, options = {}) {
    const { temperature = 0.7, maxTokens = 1024, context = '' } = options;

    let systemPrompt = this.getSystemPrompt();
    if (context) {
      systemPrompt += `\n\n${context}`;
    }

    // Prepend system message
    const allMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: allMessages,
        temperature,
        max_tokens: maxTokens
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Groq API error');
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      model: data.model
    };
  }
}
