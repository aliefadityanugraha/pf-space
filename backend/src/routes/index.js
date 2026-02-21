/**
 * src/routes/index.js
 * 
 * Central router entry point. Registers all feature-specific route groups.
 */

import authRoutes from './auth.routes.js';
import categoryRoutes from './category.routes.js';
import filmRoutes from './film.routes.js';
import voteRoutes from './vote.routes.js';
import discussionRoutes from './discussion.routes.js';
import chatRoutes from './chat.routes.js';
import collectionRoutes from './collection.routes.js';
import adminRoutes from './admin.routes.js';
import userRoutes from './user.routes.js';
import notificationRoutes from './notification.routes.js';
import { communityRoutes } from './community.routes.js';
import learningMaterialRoutes from './learningMaterial.routes.js';

/**
 * Register all application routes with their respective prefixes
 * @param {import('fastify').FastifyInstance} fastify - Fastify instance
 */
export default async function routes(fastify) {
  // Auth and profile management
  await fastify.register(authRoutes, { prefix: '/auth' });

  // Public user profiles
  await fastify.register(userRoutes, { prefix: '/users' });

  // User notifications
  await fastify.register(notificationRoutes, { prefix: '/notifications' });

  // Movie categories
  await fastify.register(categoryRoutes, { prefix: '/categories' });

  // Core film management
  await fastify.register(filmRoutes, { prefix: '/films' });

  // Likes and voting
  await fastify.register(voteRoutes, { prefix: '/votes' });

  // Film comments and discussions
  await fastify.register(discussionRoutes, { prefix: '/discussions' });

  // Community-wide discussion board
  await fastify.register(communityRoutes, { prefix: '/community' });

  // AI assistant chat
  await fastify.register(chatRoutes, { prefix: '/chat' });

  // Personal watchlists/bookmarks
  await fastify.register(collectionRoutes, { prefix: '/collections' });

  // Learning materials (Materi)
  await fastify.register(learningMaterialRoutes, { prefix: '/learning-materials' });

  // System administration
  await fastify.register(adminRoutes, { prefix: '/admin' });

  // Basic API health status
  fastify.get('/health', async () => {
    return { 
      success: true,
      message: 'API is running',
      timestamp: new Date().toISOString()
    };
  });
}
