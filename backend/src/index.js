/**
 * src/index.js
 * 
 * Main entry point for the Fastify server. Configures plugins, 
 * database initialization, static file serving, and API routes.
 * 
 */

import 'dotenv/config';
import crypto from 'crypto';
import { validateEnv } from './config/env.js';
import { parseAllowedOrigins } from './config/constants.js';

// Validate environment variables before anything else
validateEnv();

import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import compress from '@fastify/compress';
import { initDatabase, knex } from './database/index.js';
import routes from './routes/index.js';
import tusRoutes from './routes/tus.routes.js';
import staticRoutes from './routes/static.routes.js';
import seoRoutes from './routes/seo.routes.js';
import fastifyStatic from '@fastify/static';
import { UPLOAD_DIR } from './lib/upload.js';
import { seoMiddleware } from './middlewares/index.js';
import { globalErrorHandler } from './middlewares/errorHandler.js';

const fastify = Fastify({
  logger: true,
  trustProxy: true,
  // Use incoming X-Request-ID header, or generate a new UUID
  requestIdHeader: 'x-request-id',
  genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID()
});

// Prevent crash from internal Node.js/Undine stream issues
process.on('uncaughtException', (err) => {
  if (err.code === 'ERR_INVALID_STATE') {
    // This is a known issue in Node 23+ where streams might close twice
    // during complex socket operations. We log it and continue.
    const logFn = typeof fastify !== 'undefined' ? fastify.log.warn.bind(fastify.log) : console.warn;
    logFn({ err }, 'Caught and ignored ERR_INVALID_STATE (ReadableStream already closed)');
    return;
  }
  const logFn = typeof fastify !== 'undefined' ? fastify.log.error.bind(fastify.log) : console.error;
  logFn(err, 'Uncaught Exception');
  process.exit(1);
});

// SEO Hook for bots
fastify.addHook('onRequest', seoMiddleware);

// Reflect X-Request-ID back on every response for log tracing
fastify.addHook('onSend', async (request, reply, payload) => {
  reply.header('X-Request-ID', request.id);
  return payload;
});

// Register plugins
await fastify.register(helmet, {
  // Allow cross-origin access to static files (uploads)
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // Allow iframe embedding
  frameguard: false,
  // Restrictive CSP for API server — frontend SPA handles its own CSP
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      scriptSrc: ["'none'"],
      imgSrc: ["'self'", "data:"],
      mediaSrc: ["'self'"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      // Allow embedding in local frontend iframe on localhost:5173
      frameAncestors: ["'self'", 'http://localhost:5173'],
    }
  },
});

await fastify.register(compress);

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  // Per-route overrides can be set via route config: { config: { rateLimit: { max: 10 } } }
  keyGenerator: (request) => request.ip,
  errorResponseBuilder: () => ({
    success: false,
    message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
  })
});

const allowedOrigins = parseAllowedOrigins();
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;

  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.[0-9]+\.[0-9]+)(:\d+)?$/.test(origin);
};

await fastify.register(cors, {
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return cb(null, true);
    // Allow localhost and local network IPs (for development/testing)
    const isLocalNetwork = /^(https?:\/\/)(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin);
    if (isLocalNetwork) return cb(null, true);
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // Reject unknown origins
    cb(new Error('Not allowed by CORS: ' + origin), false);
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

// Register SEO routes (root level)
await fastify.register(seoRoutes);

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

    await knex.destroy(); // Use statically imported knex instance
    console.log('✅ Database connections closed');
  } catch (err) {
    console.error('Error during shutdown:', err);
  }
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
