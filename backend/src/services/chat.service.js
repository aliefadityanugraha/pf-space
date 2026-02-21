/**
 * src/services/chat.service.js
 * 
 * Service for AI chat business logic, interacting with AI providers
 * for smart queries about the film archive (RAG pattern).
 */

import { ChatHistory, Film } from '../models/index.js';
import { getAI } from '../lib/ai/index.js';
import { embeddingService } from './embedding.service.js';

export class ChatService {
  /**
   * Process a user chat message, fetching context and generating AI response
   * @param {string} userId - User ID making the request
   * @param {string} userPrompt - Current user question/input
   * @returns {Promise<object>} Chat response data with model used and saved chat ID
   */
  async chat(userId, userPrompt) {
    const ai = getAI();

    // Get film context (RAG with semantic search if available)
    const filmContext = await this.getFilmContext(userPrompt);

    // Get recent chat history for context (last 5 messages)
    const history = await this.getRecentHistory(userId, 5);
    
    // Build messages array with history
    const messages = [];
    for (const chat of history.reverse()) {
      messages.push({ role: 'user', content: chat.user_prompt });
      messages.push({ role: 'assistant', content: chat.ai_response });
    }
    messages.push({ role: 'user', content: userPrompt });

    // Get AI response with context
    const response = await ai.chat(messages, { context: filmContext });

    // Save to history
    const saved = await ChatHistory.query().insert({
      user_id: userId,
      user_prompt: userPrompt,
      ai_response: response.content
    });

    return {
      chat_id: saved.chat_id,
      user_prompt: userPrompt,
      ai_response: response.content,
      model: response.model
    };
  }

  /**
   * Retrieve relevant film context to aid AI response (Retrieval-Augmented Generation)
   * @param {string|null} userPrompt - User query to find similar films
   * @returns {Promise<string>} Formatted text containing film summaries
   */
  async getFilmContext(userPrompt = null) {
    try {
      const useSemanticSearch = process.env.USE_SEMANTIC_SEARCH === 'true';
      let films;

      if (useSemanticSearch && userPrompt) {
        // Use semantic search to find relevant films
        try {
          films = await embeddingService.findSimilarFilms(userPrompt, {
            limit: 10,
            threshold: 0.3
          });
          console.log(`Found ${films.length} relevant films using semantic search`);
        } catch (error) {
          console.warn('Semantic search failed, falling back to recent films:', error.message);
          // Fallback to recent films if semantic search fails
          films = await Film.query()
            .where('status', 'published')
            .withGraphFetched('category')
            .orderBy('created_at', 'desc')
            .limit(30);
        }
      } else {
        // Use traditional approach: get recent films
        films = await Film.query()
          .where('status', 'published')
          .withGraphFetched('category')
          .orderBy('created_at', 'desc')
          .limit(30);
      }

      if (films.length === 0) return '';

      const filmList = films.map(f => {
        const category = f.category ? (f.category.nama_kategori || f.category.name || 'Umum') : 'Umum';
        const relevanceNote = f.similarity ? ` (Relevance: ${(f.similarity * 100).toFixed(1)}%)` : '';
        return `- Judul: "${f.judul}" (${f.tahun_karya || 'N/A'})${relevanceNote}
  Genre: ${category}
  Sinopsis: ${f.sinopsis || 'Tidak ada sinopsis'}
  Link: /film/${f.slug}`;
      }).join('\n\n');

      const searchMethod = useSemanticSearch && userPrompt ? 'paling relevan dengan pertanyaan' : 'terbaru';
      return `Berikut adalah daftar film ${searchMethod} di arsip PF Space:\n\n${filmList}\n\nGunakan informasi ini untuk menjawab pertanyaan pengguna tentang rekomendasi atau detail film.`;
    } catch (error) {
      console.error('Error fetching film context:', error);
      return '';
    }
  }

  /**
   * Get paginated chat history for a specific user
   * @param {string} userId - User ID
   * @param {object} options - Pagination options
   * @returns {Promise<{chats: ChatHistory[], pagination: object}>} Paginated chat history
   */
  async getHistory(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const [chats, totalResult] = await Promise.all([
      ChatHistory.query()
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset),
      ChatHistory.query()
        .where('user_id', userId)
        .count('chat_id as total')
        .first()
    ]);

    return {
      chats: chats.reverse(), // Oldest first for display
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(totalResult.total),
        totalPages: Math.ceil(totalResult.total / limit)
      }
    };
  }

  /**
   * Get the N most recent chat messages for context
   * @param {string} userId - User ID
   * @param {number} [limit=5] - Number of messages to retrieve
   * @returns {Promise<ChatHistory[]>} Recent chat history records
   */
  async getRecentHistory(userId, limit = 5) {
    return ChatHistory.query()
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(limit);
  }

  /**
   * Delete all chat history for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of deleted chats
   */
  async clearHistory(userId) {
    return ChatHistory.query()
      .where('user_id', userId)
      .delete();
  }

  /**
   * Delete a single chat record
   * @param {number} chatId - Chat entry ID
   * @param {string} userId - Owner user ID
   * @returns {Promise<number>} Number of deleted rows
   */
  async deleteChat(chatId, userId) {
    return ChatHistory.query()
      .where('chat_id', chatId)
      .where('user_id', userId)
      .delete();
  }
}

export const chatService = new ChatService();
