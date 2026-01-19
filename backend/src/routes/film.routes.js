import { filmController } from '../controllers/index.js';
import { authenticate, requireModerator, requireAdmin, requireCreator, optionalAuth } from '../middlewares/index.js';

export default async function filmRoutes(fastify) {
  // Public: Get all published films (admin can see all with status filter)
  fastify.get('/', {
    preHandler: optionalAuth
  }, filmController.getAll.bind(filmController));

  // Public: Get latest films
  fastify.get('/latest', filmController.getLatest.bind(filmController));

  // Public: Get banner films
  fastify.get('/banners', filmController.getBanners.bind(filmController));

  // Admin: Get pending films for approval
  fastify.get('/pending', {
    preHandler: requireModerator
  }, filmController.getPending.bind(filmController));

  // Creator: Get my films
  fastify.get('/my-films', {
    preHandler: requireCreator
  }, filmController.getMyFilms.bind(filmController));

  // Public: Get single film (with optional auth for unpublished)
  fastify.get('/:id', {
    preHandler: optionalAuth
  }, filmController.getById.bind(filmController));

  // Creator: Create new film
  fastify.post('/', {
    preHandler: requireCreator
  }, filmController.create.bind(filmController));

  // Creator: Update own film
  fastify.put('/:id', {
    preHandler: authenticate
  }, filmController.update.bind(filmController));

  // Creator: Delete own film
  fastify.delete('/:id', {
    preHandler: authenticate
  }, filmController.delete.bind(filmController));

  // Admin/Moderator: Approve film
  fastify.patch('/:id/approve', {
    preHandler: requireModerator
  }, filmController.approve.bind(filmController));

  // Admin/Moderator: Reject film
  fastify.patch('/:id/reject', {
    preHandler: requireModerator
  }, filmController.reject.bind(filmController));
}
