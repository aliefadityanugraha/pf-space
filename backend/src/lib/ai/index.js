/**
 * src/lib/ai/index.js
 * 
 * Factory for AI providers. Supports multiple backends like 
 * Groq, OpenAI, and Gemini.
 */

import { GroqProvider } from './groq.provider.js';
import { OpenAIProvider } from './openai.provider.js';
import { GeminiProvider } from './gemini.provider.js';

const providers = {
  groq: GroqProvider,
  openai: OpenAIProvider,
  gemini: GeminiProvider
};

let aiInstance = null;

/**
 * Create a new AI provider instance by name
 * @param {string|null} providerName - Provider name ('groq', 'openai', 'gemini')
 * @returns {BaseAIProvider} AI provider instance
 * @throws {Error} If provider name is unknown
 */
export function getAIProvider(providerName = null) {
  const name = providerName || process.env.AI_PROVIDER || 'gemini';
  
  const ProviderClass = providers[name];
  if (!ProviderClass) {
    throw new Error(`Unknown AI provider: ${name}. Available: ${Object.keys(providers).join(', ')}`);
  }

  return new ProviderClass();
}

/**
 * Get the singleton AI provider instance (lazy-initialized)
 * @returns {BaseAIProvider} Shared AI provider instance
 */
export function getAI() {
  if (!aiInstance) {
    aiInstance = getAIProvider();
  }
  return aiInstance;
}

export { GroqProvider, OpenAIProvider, GeminiProvider };
