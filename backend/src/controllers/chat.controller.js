/**
 * src/controllers/chat.controller.js
 * 
 * Controller for AI chat interactions and chat history management.
 */

import { chatService } from '../services/index.js';
import { ApiResponse } from '../lib/response.js';

export class ChatController {
  /**
   * Send a user message to the AI and receive a context-aware response
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async chat(request, reply) {
    const result = await chatService.chat(request.user.id, request.body.message.trim());
    return ApiResponse.success(reply, result);
  }

  /**
   * Retrieve paginated chat history for the logged-in user
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getHistory(request, reply) {
    const { page, limit } = request.query;

    const result = await chatService.getHistory(request.user.id, { page, limit });

    return ApiResponse.success(
      reply, 
      result.chats, 
      'Chat history retrieved successfully', 
      200, 
      result.pagination
    );
  }

  /**
   * Delete all chat messages in the user's history
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async clearHistory(request, reply) {
    await chatService.clearHistory(request.user.id);
    return ApiResponse.success(reply, null, 'Chat history cleared');
  }

  /**
   * Permanently delete a single chat record by ID
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async deleteChat(request, reply) {
    const { id } = request.params;

    const deleted = await chatService.deleteChat(id, request.user.id);

    if (!deleted) {
      return ApiResponse.notFound(reply, 'Chat not found');
    }

    return ApiResponse.success(reply, null, 'Chat deleted');
  }
}

export const chatController = new ChatController();
