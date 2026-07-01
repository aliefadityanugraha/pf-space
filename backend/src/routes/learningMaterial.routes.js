import { learningMaterialController } from '../controllers/index.js';
import { authenticate, requireModerator, optionalAuth, validateRequest } from '../middlewares/index.js';
import {
  materialCreateSchema,
  materialUpdateSchema,
  materialQuerySchema,
  materialIdParamSchema
} from '../lib/validation.js';

export default async function learningMaterialRoutes(fastify) {
  fastify.get('/', {
    preHandler: [optionalAuth, validateRequest(materialQuerySchema, 'query')]
  }, learningMaterialController.getAll.bind(learningMaterialController));

  fastify.get('/:id', learningMaterialController.getById.bind(learningMaterialController));

  fastify.post('/', {
    preHandler: [requireModerator, validateRequest(materialCreateSchema, 'body')]
  }, learningMaterialController.create.bind(learningMaterialController));

  fastify.put('/:id', {
    preHandler: [requireModerator, validateRequest(materialUpdateSchema, 'body')]
  }, learningMaterialController.update.bind(learningMaterialController));

  fastify.delete('/:id', {
    preHandler: requireModerator
  }, learningMaterialController.delete.bind(learningMaterialController));

  fastify.patch('/:id/toggle', {
    preHandler: requireModerator
  }, learningMaterialController.toggleStatus.bind(learningMaterialController));
}
