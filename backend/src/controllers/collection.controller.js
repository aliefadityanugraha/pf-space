/**
 * src/controllers/collection.controller.js
 * 
 * Controller for managing user film collections (bookmarks/watchlist).
 */

import { collectionService, filmService } from '../services/index.js';
import { ApiResponse } from '../lib/response.js';

export class CollectionController {
  /**
   * Add or remove a film from the user's personal collection
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async toggleCollection(request, reply) {
    const { filmId } = request.params;

    // Check film exists and is published
    const film = await filmService.getById(filmId);
    if (!film || film.status !== 'published') {
      return ApiResponse.notFound(reply, 'Film not found');
    }

    const isInCollection = await collectionService.isInCollection(filmId, request.user.id);

    if (isInCollection) {
      await collectionService.remove(filmId, request.user.id);
    } else {
      await collectionService.add(filmId, request.user.id);
    }

    return ApiResponse.success(reply, { 
      is_in_collection: !isInCollection
    }, isInCollection ? 'Film removed from collection' : 'Film added to collection');
  }

  /**
   * Check if a specific film is in the current user's collection
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getStatus(request, reply) {
    const { filmId } = request.params;
    
    let isInCollection = false;
    if (request.user) {
      isInCollection = await collectionService.isInCollection(filmId, request.user.id);
    }

    return ApiResponse.success(reply, { 
      is_in_collection: isInCollection
    });
  }

  /**
   * Fetch a paginated list of all films in the user's personal collection
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getMyCollections(request, reply) {
    const { page, limit } = request.query;
    
    const result = await collectionService.getUserCollections(request.user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10
    });

    return ApiResponse.success(
      reply, 
      result.collections, 
      'Collections retrieved successfully', 
      200, 
      result.pagination
    );
  }
}

export const collectionController = new CollectionController();
