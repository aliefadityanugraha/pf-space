import { tusServer } from '../lib/tus.js';
import { parseAllowedOrigins } from '../config/constants.js';

export default async function tusRoutes(fastify) {
  const allowedOrigins = parseAllowedOrigins();

  // Allow all content types on TUS endpoints so Fastify passes the raw stream directly to @tus/server
  fastify.addContentTypeParser('*', (request, payload, done) => {
    done(null);
  });

  fastify.addHook('onRequest', async (request, reply) => {
    const requestOrigin = request.headers.origin;
    
    // Izinkan Origin jika ada di list, atau jika request berasal dari IP lokal (192.168.x.x / 10.x.x.x / localhost)
    let origin = allowedOrigins[0];
    if (requestOrigin) {
      if (allowedOrigins.includes(requestOrigin) || /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin)) {
        origin = requestOrigin;
      }
    }
    
    reply.header('Access-Control-Allow-Origin', origin);
    reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
    reply.header('Access-Control-Allow-Headers', 'Tus-Resumable, Upload-Length, Upload-Offset, Upload-Metadata, Content-Type, Content-Length, Authorization, Tus-Version, X-HTTP-Method-Override, X-Requested-With');
    reply.header('Access-Control-Expose-Headers', 'Tus-Resumable, Upload-Length, Upload-Offset, Upload-Metadata, Location, Tus-Version, Tus-Extension, Tus-Max-Size');
    reply.header('Access-Control-Allow-Credentials', 'true');
    reply.header('Cache-Control', 'no-store');
    reply.header('X-Accel-Buffering', 'no');

    if (request.method === 'OPTIONS') {
      reply.code(204).send();
      return;
    }
  });

  // Handler utama untuk Tus Server
  const handleTus = async (request, reply) => {
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
  };

  // Match both the upload creation endpoint and the per-resource resume endpoint.
  fastify.route({
    method: ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'],
    url: '/',
    config: { rateLimit: false },
    handler: handleTus,
  });

  fastify.route({
    method: ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'],
    url: '/:id',
    config: { rateLimit: false },
    handler: handleTus,
  });
}