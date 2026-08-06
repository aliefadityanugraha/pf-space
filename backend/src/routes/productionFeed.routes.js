import { productionFeedController } from '../controllers/index.js';
import { authenticate, requireModerator, requireCreator, optionalAuth, validateRequest } from '../middlewares/index.js';
import {
  productionFeedQuerySchema,
  productionPostIdParamSchema,
  productionPostNumericIdParamSchema,
  productionTagIdParamSchema,
  productionPostCreateSchema,
  productionPostUpdateSchema,
  tagCreateSchema,
  tagUpdateSchema
} from '../schemas/productionFeed.zod.js';

/**
 * Register Production Feed routes (prefix: /production-feed)
 * @param {import('fastify').FastifyInstance} fastify - Fastify instance
 */
export default async function productionFeedRoutes(fastify) {
  // Public: list published posts (optional auth enriches owner data)
  fastify.get('/', {
    preHandler: [optionalAuth, validateRequest(productionFeedQuerySchema, 'query')]
  }, productionFeedController.getAll.bind(productionFeedController));

  // Public: all tags for filter/search UI
  fastify.get('/tags', productionFeedController.getTags.bind(productionFeedController));

  // Moderator/Admin: manage tags
  fastify.post('/tags', {
    preHandler: [requireModerator, validateRequest(tagCreateSchema, 'body')]
  }, productionFeedController.createTag.bind(productionFeedController));

  fastify.put('/tags/:tagId', {
    preHandler: [requireModerator, validateRequest(productionTagIdParamSchema, 'params'), validateRequest(tagUpdateSchema, 'body')]
  }, productionFeedController.updateTag.bind(productionFeedController));

  fastify.delete('/tags/:tagId', {
    preHandler: [requireModerator, validateRequest(productionTagIdParamSchema, 'params')]
  }, productionFeedController.deleteTag.bind(productionFeedController));

  // Creator: my posts (all statuses)
  fastify.get('/my', {
    preHandler: requireCreator
  }, productionFeedController.getMyPosts.bind(productionFeedController));

  // Public: single post (numeric ID or slug, optional auth for drafts of owner)
  fastify.get('/:id', {
    preHandler: [validateRequest(productionPostIdParamSchema, 'params'), optionalAuth]
  }, productionFeedController.getById.bind(productionFeedController));

  // Creator: create new post (rate limited)
  fastify.post('/', {
    preHandler: [requireCreator, validateRequest(productionPostCreateSchema, 'body')],
    config: { rateLimit: { max: 20, timeWindow: '1 hour' } }
  }, productionFeedController.create.bind(productionFeedController));

  // Owner/Moderator: update post
  fastify.put('/:id', {
    preHandler: [
      authenticate,
      validateRequest(productionPostNumericIdParamSchema, 'params'),
      validateRequest(productionPostUpdateSchema, 'body')
    ]
  }, productionFeedController.update.bind(productionFeedController));

  // Owner/Moderator: soft delete post
  fastify.delete('/:id', {
    preHandler: [authenticate, validateRequest(productionPostNumericIdParamSchema, 'params')]
  }, productionFeedController.delete.bind(productionFeedController));

  // Owner/Moderator: publish draft
  fastify.patch('/:id/publish', {
    preHandler: [authenticate, validateRequest(productionPostNumericIdParamSchema, 'params')]
  }, productionFeedController.publish.bind(productionFeedController));

  // Owner/Moderator: archive post
  fastify.patch('/:id/archive', {
    preHandler: [authenticate, validateRequest(productionPostNumericIdParamSchema, 'params')]
  }, productionFeedController.archive.bind(productionFeedController));
}
