import { settingController } from '../controllers/setting.controller.js';
import { requireAdmin } from '../middlewares/index.js';

export default async function settingRoutes(fastify) {
  // Public Endpoint: Get settings specifically marked as public
  fastify.get('/public', settingController.getPublicSettings.bind(settingController));

  // Admin Endpoints: Full management
  fastify.get('/', {
    preHandler: requireAdmin
  }, settingController.getAllSettings.bind(settingController));

  fastify.get('/:key', {
    preHandler: requireAdmin
  }, settingController.getSettingByKey.bind(settingController));

  fastify.post('/:key', {
    preHandler: requireAdmin
  }, settingController.updateSetting.bind(settingController));
}
