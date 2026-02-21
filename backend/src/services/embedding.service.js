/**
 * src/services/embedding.service.js
 * 
 * Service for generating, updating, and managing vector embeddings for films 
 * to enable semantic (RAG-based) search capabilities.
 */

import { Film } from '../models/index.js';
import { getAI } from '../lib/ai/index.js';

export class EmbeddingService {
  /**
   * Generate an embedding vector for a film based on its title, synopsis, and other fields
   * @param {Film} film - Film model instance with category fetched
   * @returns {Promise<number[]>} High-dimensional embedding vector
   * @throws {Error} If current AI provider doesn't support embeddings
   */
  async generateFilmEmbedding(film) {
    const ai = getAI();
    
    // Check if provider supports embedding
    if (typeof ai.generateEmbedding !== 'function') {
      throw new Error('Current AI provider does not support embedding generation. Please use Gemini or OpenAI.');
    }

    // Combine relevant text fields for embedding
    const textToEmbed = this.prepareFilmText(film);
    
    // Generate embedding
    const embedding = await ai.generateEmbedding(textToEmbed);
    
    return embedding;
  }

  /**
   * Concatenate relevant film fields into a single string for embedding generation
   * @param {Film} film - Film object
   * @returns {string} Prepared text
   */
  prepareFilmText(film) {
    const parts = [];
    
    if (film.judul) parts.push(`Judul: ${film.judul}`);
    if (film.sinopsis) parts.push(`Sinopsis: ${film.sinopsis}`);
    if (film.deskripsi_lengkap) parts.push(`Deskripsi: ${film.deskripsi_lengkap}`);
    if (film.category?.nama_kategori) parts.push(`Genre: ${film.category.nama_kategori}`);
    if (film.tahun_karya) parts.push(`Tahun: ${film.tahun_karya}`);
    
    return parts.join('\n');
  }

  /**
   * Calculate and save the embedding for a specific film in the database
   * @param {number} filmId - Film ID
   * @returns {Promise<{success: boolean, filmId: number}>} Result object
   */
  async updateFilmEmbedding(filmId) {
    const film = await Film.query()
      .findById(filmId)
      .withGraphFetched('category');
    
    if (!film) {
      throw new Error('Film not found');
    }

    const embedding = await this.generateFilmEmbedding(film);
    
    await Film.query()
      .findById(filmId)
      .patch({
        embedding: JSON.stringify(embedding)
      });

    return { success: true, filmId };
  }

  /**
   * Batch generate embeddings for all published films that are currently missing them
   * @returns {Promise<object[]>} Array of result statuses for each film processed
   */
  async generateMissingEmbeddings() {
    const films = await Film.query()
      .where('status', 'published')
      .whereNull('embedding')
      .withGraphFetched('category');

    const results = [];
    
    for (const film of films) {
      try {
        const embedding = await this.generateFilmEmbedding(film);
        
        await Film.query()
          .findById(film.film_id)
          .patch({
            embedding: JSON.stringify(embedding)
          });

        results.push({ filmId: film.film_id, success: true });
        console.log(`✓ Generated embedding for: ${film.judul}`);
      } catch (error) {
        results.push({ filmId: film.film_id, success: false, error: error.message });
        console.error(`✗ Failed for ${film.judul}:`, error.message);
      }
    }

    return results;
  }

  /**
   * Utility to calculate cosine similarity between two numerical vectors
   * @param {number[]} vecA - First vector
   * @param {number[]} vecB - Second vector
   * @returns {number} Similarity score between -1 and 1
   * @throws {Error} If vectors have unequal lengths
   */
  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Find films semantically similar to a plain-text user query
   * @param {string} queryText - User's natural language query
   * @param {object} [options={}] - Search settings
   * @param {number} [options.limit=10] - Max results
   * @param {number} [options.threshold=0.5] - Min similarity score threshold
   * @returns {Promise<Film[]>} Array of film objects with similarity property
   */
  async findSimilarFilms(queryText, options = {}) {
    const { limit = 10, threshold = 0.5 } = options;

    // Generate embedding for query
    const ai = getAI();
    const queryEmbedding = await ai.generateEmbedding(queryText);

    // Get all films with embeddings
    const films = await Film.query()
      .where('status', 'published')
      .whereNotNull('embedding')
      .withGraphFetched('category');

    // Calculate similarity scores
    const filmsWithScores = films.map(film => {
      const filmEmbedding = JSON.parse(film.embedding);
      const similarity = this.cosineSimilarity(queryEmbedding, filmEmbedding);
      
      return {
        ...film,
        similarity
      };
    });

    // Filter by threshold and sort by similarity
    const relevantFilms = filmsWithScores
      .filter(film => film.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return relevantFilms;
  }
}

export const embeddingService = new EmbeddingService();
