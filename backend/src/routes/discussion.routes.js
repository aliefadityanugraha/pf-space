import { discussionController } from '../controllers/index.js';
import { authenticate, requireModerator, validateRequest } from '../middlewares/index.js';
import { commentSchema } from '../lib/validation.js';
import { productionPostNumericParamSchema } from '../schemas/productionFeed.zod.js';

/**
 * Register discussion routes
 * @param {import('fastify').FastifyInstance} fastify - Fastify instance
 */
export default async function discussionRoutes(fastify) {
  // Public: List all comments for a film (paged/nested)
  fastify.get('/film/:filmId', discussionController.getByFilm.bind(discussionController));

  // Public: Get comment count for a film
  fastify.get('/film/:filmId/count', discussionController.getCommentCount.bind(discussionController));

  // Public: List comments of a production feed post (via comment adapter)
  fastify.get('/post/:postId', {
    preHandler: validateRequest(productionPostNumericParamSchema, 'params')
  }, discussionController.getCommentsByPost.bind(discussionController));

  // Public: Get comment count for a production feed post
  fastify.get('/post/:postId/count', {
    preHandler: validateRequest(productionPostNumericParamSchema, 'params')
  }, discussionController.getCommentCountByPost.bind(discussionController));

  // Public: Get single comment
  fastify.get('/:id', discussionController.getById.bind(discussionController));

  // Admin/Moderator: Flat list of all comments for moderation
  fastify.get('/all', {
    preHandler: requireModerator
  }, discussionController.getAllFlat.bind(discussionController));

  // User: Post a new comment or reply
  fastify.post('/film/:filmId', {
    preHandler: [authenticate, validateRequest(commentSchema, 'body')]
  }, discussionController.create.bind(discussionController));

  // User: Add a comment to a production feed post (rate limited)
  fastify.post('/post/:postId', {
    preHandler: [
      validateRequest(productionPostNumericParamSchema, 'params'),
      authenticate,
      validateRequest(commentSchema, 'body')
    ],
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } }
  }, discussionController.addCommentToPost.bind(discussionController));

  // User: Edit own comment content
  fastify.put('/:id', {
    preHandler: [authenticate, validateRequest(commentSchema, 'body')]
  }, discussionController.update.bind(discussionController));

  // User/Admin/Moderator: Delete a comment
  fastify.delete('/:id', {
    preHandler: authenticate
  }, discussionController.delete.bind(discussionController));
}
