/**
 * src/routes/tus.routes.js
 * 
 * Routes for large file uploads using the Tus resumable protocol.
 */

import { tusServer } from '../lib/tus.js';

/**
 * Register Tus protocol routes for large file uploads
 * @param {import('fastify').FastifyInstance} fastify - Fastify instance
 */
export default async function tusRoutes(fastify) {
  // Parse allowed origins once
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [process.env.FRONTEND_URL || 'http://localhost:5173'];

  /**
   * Set CORS headers on EVERY request (including 404 errors)
   * This runs before the tus handler, ensuring error responses also have CORS headers
   */
  fastify.addHook('onRequest', async (request, reply) => {
    const requestOrigin = request.headers.origin;
    const origin = allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];
    
    reply.header('Access-Control-Allow-Origin', origin);
    reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
    reply.header('Access-Control-Allow-Headers', 'Tus-Resumable, Upload-Length, Upload-Offset, Upload-Metadata, Content-Type, Content-Length, Authorization, Tus-Version, X-HTTP-Method-Override, X-Requested-With');
    reply.header('Access-Control-Expose-Headers', 'Tus-Resumable, Upload-Length, Upload-Offset, Upload-Metadata, Location, Tus-Version, Tus-Extension, Tus-Max-Size');
    reply.header('Access-Control-Allow-Credentials', 'true');

    // Handle Preflight (OPTIONS) immediately
    if (request.method === 'OPTIONS') {
      reply.code(204).send();
      return;
    }
  });

  /**
   * All requests to /api/files/* are proxied to the @tus/server handler.
   */
  fastify.all('/*', {
    config: { rateLimit: false }
  }, async (request, reply) => {
    try {
      return await tusServer.handle(request.raw, reply.raw);
    } catch (error) {
      request.log.error('Tus error:', error);
      if (!reply.raw.headersSent) {
        reply.raw.statusCode = 500;
        reply.raw.setHeader('Content-Type', 'application/json');
        reply.raw.end(JSON.stringify({ error: 'Upload system failed' }));
      }
    }
  });
}
