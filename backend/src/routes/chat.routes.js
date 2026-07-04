/**
 * src/routes/chat.routes.js
 * 
 * Routes for AI-powered chat interactions.
 */

import { chatController } from '../controllers/index.js';
import { authenticate } from '../middlewares/index.js';

/**
 * Register AI chat routes
 * @param {import('fastify').FastifyInstance} fastify - Fastify instance
 */
export default async function chatRoutes(fastify) {
  // User: Send message to AI
  fastify.post('/', {
    preHandler: authenticate
  }, chatController.chat.bind(chatController));

  // User: Get personal chat history
  fastify.get('/history', {
    preHandler: authenticate
  }, chatController.getHistory.bind(chatController));

  // User: Clear all history
  fastify.delete('/history', {
    preHandler: authenticate
  }, chatController.clearHistory.bind(chatController));

  // User: Delete single chat message
  fastify.delete('/history/:id', {
    preHandler: authenticate
  }, chatController.deleteChat.bind(chatController));
}
