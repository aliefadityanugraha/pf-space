import { authController } from '../controllers/index.js';
import { authenticate, requireAdmin } from '../middlewares/index.js';
import { updateProfileSchema, updateRoleSchema } from '../schemas/auth.schema.js';

/**
 * Register authentication and profile routes
 * @param {import('fastify').FastifyInstance} fastify - Fastify instance
 */
export default async function authRoutes(fastify) {
  // Current user profile
  fastify.get('/me', {
    preHandler: authenticate
  }, authController.getProfile.bind(authController));

  fastify.get('/profile', {
    preHandler: authenticate
  }, authController.getProfile.bind(authController));

  // Update user profile
  fastify.post('/update-profile', {
    preHandler: authenticate,
    schema: updateProfileSchema
  }, authController.updateUser.bind(authController));

  // Admin: Get all users
  fastify.get('/users', {
    preHandler: requireAdmin
  }, authController.getAllUsers.bind(authController));

  // Admin: Get all roles
  fastify.get('/roles', {
    preHandler: requireAdmin
  }, authController.getAllRoles.bind(authController));

  // Admin: Update user role
  fastify.patch('/users/:userId/role', {
    preHandler: requireAdmin,
    schema: updateRoleSchema
  }, authController.updateRole.bind(authController));

  // Social Auth: Google
  fastify.get('/google', authController.googleAuth.bind(authController));

  // Logout
  fastify.post('/logout', authController.logout.bind(authController));

  // Better-Auth catch-all (proxying all internal better-auth requests)
  fastify.all('/*', authController.handleAuth.bind(authController));
}
