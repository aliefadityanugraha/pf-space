import { filmController } from '../controllers/index.js';
import { authenticate, requireModerator, requireCreator, optionalAuth, viewRateLimit, validateRequest } from '../middlewares/index.js';
import { numericIdParamSchema, filmIdParamSchema } from '../schemas/film.zod.js';
import { filmCreateSchema, filmUpdateSchema, rejectionSchema } from '../lib/validation.js';

/**
 * Register film-related routes
 * @param {import('fastify').FastifyInstance} fastify - Fastify instance
 */
export default async function filmRoutes(fastify) {
  // Public: Get all published films (admin can see all with status filter)
  fastify.get('/', {
    preHandler: optionalAuth
  }, filmController.getAll.bind(filmController));

  // Public: Get latest films
  fastify.get('/latest', {
    preHandler: async (request, reply) => {
      reply.header('Cache-Control', 'public, max-age=60'); // 1 minute cache
    }
  }, filmController.getLatest.bind(filmController));

  // Public: Get banner films
  fastify.get('/banners', {
    preHandler: async (request, reply) => {
      reply.header('Cache-Control', 'public, max-age=0, must-revalidate'); // Disable cache for banners to show updates immediately
    }
  }, filmController.getBanners.bind(filmController));

  // Admin: Get pending films for approval
  fastify.get('/pending', {
    preHandler: requireModerator
  }, filmController.getPending.bind(filmController));

  // Creator: Get my films
  fastify.get('/my-films', {
    preHandler: requireCreator
  }, filmController.getMyFilms.bind(filmController));

  // Creator: Get dashboard stats
  fastify.get('/my-stats', {
    preHandler: requireCreator
  }, filmController.getStats.bind(filmController));

  // Development Debug: Get overall queue operational metrics
  fastify.get('/transcode/queue', {
    preHandler: [authenticate]
  }, filmController.getTranscodeQueueMetrics.bind(filmController));

  // Public: Get single film (with optional auth for unpublished)
  fastify.get('/:id', {
    preHandler: [validateRequest(filmIdParamSchema, 'params'), optionalAuth]
  }, filmController.getById.bind(filmController));

  // Public: Get related films
  fastify.get('/:id/related', {
    preHandler: [
      validateRequest(filmIdParamSchema, 'params'),
      async (request, reply) => {
        reply.header('Cache-Control', 'public, max-age=300'); // 5 minutes cache
      }
    ]
  }, filmController.getRelated.bind(filmController));

  // Public: Increment view count (rate-limited per IP)
  fastify.post('/:id/views', {
    preHandler: [validateRequest(filmIdParamSchema, 'params'), viewRateLimit]
  }, filmController.incrementViews.bind(filmController));

  // Creator: Create new film
  fastify.post('/', {
    preHandler: [requireCreator, validateRequest(filmCreateSchema, 'body')]
  }, filmController.create.bind(filmController));

  // Creator/Admin: Update film
  fastify.put('/:id', {
    preHandler: [
      authenticate,
      validateRequest(numericIdParamSchema, 'params'),
      validateRequest(filmUpdateSchema, 'body')
    ]
  }, filmController.update.bind(filmController));

  // Creator/Admin: Delete film
  fastify.delete('/:id', {
    preHandler: [validateRequest(numericIdParamSchema, 'params'), authenticate]
  }, filmController.delete.bind(filmController));

  // Admin/Moderator: Approve film
  fastify.patch('/:id/approve', {
    preHandler: [validateRequest(numericIdParamSchema, 'params'), requireModerator]
  }, filmController.approve.bind(filmController));

  // Admin/Moderator: Reject film
  fastify.patch('/:id/reject', {
    preHandler: [
      requireModerator,
      validateRequest(numericIdParamSchema, 'params'),
      validateRequest(rejectionSchema, 'body')
    ]
  }, filmController.reject.bind(filmController));

  // Admin/Creator: Re-transcode film
  fastify.post('/:id/retranscode', {
    preHandler: [authenticate, validateRequest(numericIdParamSchema, 'params')]
  }, filmController.retranscode.bind(filmController));

  // Admin/Creator: Cancel transcoding
  fastify.post('/:id/transcode/cancel', {
    preHandler: [authenticate, validateRequest(numericIdParamSchema, 'params')]
  }, filmController.cancelTranscode.bind(filmController));

  // Development Debug: Get detailed transcode status
  fastify.get('/:id/transcode/status', {
    preHandler: [authenticate, validateRequest(numericIdParamSchema, 'params')]
  }, filmController.getTranscodeStatus.bind(filmController));

  // Audit History: Get chronological operation history
  fastify.get('/:id/transcode/history', {
    preHandler: [authenticate, validateRequest(numericIdParamSchema, 'params')]
  }, filmController.getTranscodeHistory.bind(filmController));

  // Development Debug: Get detailed audit summary
  fastify.get('/:id/transcode/audit', {
    preHandler: [authenticate, validateRequest(numericIdParamSchema, 'params')]
  }, filmController.getTranscodeAudit.bind(filmController));
}
