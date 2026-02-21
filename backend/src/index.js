/**
 * src/index.js
 * 
 * Main entry point for the Fastify server. Configures plugins, 
 * database initialization, static file serving, and API routes.
 */

import 'dotenv/config';
import { validateEnv } from './config/env.js';

// Validate environment variables before anything else
validateEnv();

import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import compress from '@fastify/compress';
import { initDatabase } from './database/index.js';
import { auth } from './lib/auth.js';
import routes from './routes/index.js';
import tusRoutes from './routes/tus.routes.js';
import staticRoutes from './routes/static.routes.js';
import fastifyStatic from '@fastify/static';
import { UPLOAD_DIR } from './lib/upload.js';
import { seoMiddleware } from './middlewares/seo.middleware.js';
import { globalErrorHandler } from './middlewares/errorHandler.js';

const fastify = Fastify({
  logger: true
});

// Prevent crash from internal Node.js/Undici stream issues
process.on('uncaughtException', (err) => {
  if (err.code === 'ERR_INVALID_STATE') {
    // This is a known issue in Node 23+ where streams might close twice
    // during complex socket operations. We log it and continue.
    fastify.log.warn({ err }, 'Caught and ignored ERR_INVALID_STATE (ReadableStream already closed)');
    return;
  }
  fastify.log.error(err, 'Uncaught Exception');
  process.exit(1);
});

// SEO Hook for bots
fastify.addHook('onRequest', seoMiddleware);

// Register plugins
await fastify.register(helmet, {
  // Allow cross-origin access to static files (uploads)
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // Allow iframe embedding
  frameguard: false,
  // Disable CSP for simplicity in dev (or configure it properly if needed)
  contentSecurityPolicy: false,
});

await fastify.register(compress);

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute'
});

// Parse allowed CORS origins from env
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [process.env.FRONTEND_URL || 'http://localhost:5173'];

await fastify.register(cors, {
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return cb(null, true);
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // Reject unknown origins
    cb(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  exposedHeaders: [
    'Tus-Resumable', 'Upload-Length', 'Upload-Offset', 'Upload-Metadata', 
    'Location', 'Content-Type', 'Content-Length', 'Tus-Version', 
    'Tus-Extension', 'Tus-Max-Size', 'X-Request-ID'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Tus-Resumable', 'Upload-Length', 'Upload-Offset', 'Upload-Metadata', 
    'Content-Type', 'Content-Length', 'Authorization', 'X-Requested-With', 
    'Accept', 'Tus-Version', 'X-HTTP-Method-Override'
  ]
});

await fastify.register(cookie);

// Multipart (only for avatar uploads in auth)
await fastify.register(multipart, {
  addToBody: true,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB (avatar only, tus handles large files)
  }
});

// Tus fix: Fastify 415 error for application/offset+octet-stream
fastify.addContentTypeParser('application/offset+octet-stream', (request, payload, done) => {
  done(null);
});

// Initialize database
await initDatabase();

// Static file serving (decorator only, routes handled in static.routes.js)
await fastify.register(fastifyStatic, {
  root: UPLOAD_DIR,
  decorateReply: true
});

await fastify.register(staticRoutes);

// Register Tus routes (resumable uploads)
await fastify.register(tusRoutes, { prefix: '/api/files' });

// Register API routes
await fastify.register(routes, { prefix: '/api' });

fastify.setErrorHandler(globalErrorHandler);

/**
 * Start the application server
 * @returns {Promise<void>}
 */
const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    console.log(`Server running at http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

/**
 * Graceful shutdown — close server and database connections cleanly
 * @param {string} signal - OS signal received (SIGTERM, SIGINT)
 */
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  try {
    await fastify.close();
    console.log('✅ Server closed');

    const { knex } = await import('./database/index.js');
    await knex.destroy();
    console.log('✅ Database connections closed');
  } catch (err) {
    console.error('Error during shutdown:', err);
  }
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
