import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase } from './database/index.js';
import { auth } from './lib/auth.js';
import routes from './routes/index.js';
import { seoMiddleware } from './middlewares/seo.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: true
});

// SEO Hook for bots
fastify.addHook('onRequest', seoMiddleware);

// Register plugins
await fastify.register(cors, {
  origin: [
    'http://localhost:5173', 
    'http://127.0.0.1:5173', 
    'http://localhost:3000',
    'https://e2389cff26ba.ngrok-free.app/',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
});

await fastify.register(cookie);

// File uploads
await fastify.register(multipart, {
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB limit for video uploads
  }
});

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, '../uploads');
console.log('STATIC UPLOAD DIR =', UPLOAD_DIR)


if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Static files
await fastify.register(fastifyStatic, {
  root: UPLOAD_DIR,
  prefix: '/uploads/',
});

// Initialize database
await initDatabase();

// Manual Google OAuth redirect - using proper Better Auth flow
fastify.get('/api/auth/google', async (request, reply) => {
  // Build the request to Better Auth
  const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
  const url = new URL('/api/auth/sign-in/social', baseURL);
  
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('Origin', baseURL);
  // Copy cookies for state management
  if (request.headers.cookie) {
    headers.set('cookie', request.headers.cookie);
  }

  const req = new Request(url.toString(), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      provider: 'google',
      callbackURL: process.env.FRONTEND_URL || 'http://localhost:5173'
    })
  });

  try {
    const response = await auth.handler(req);
    
    // Copy cookies from response (important for state!)
    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase() === 'set-cookie') {
        reply.header(key, value);
      }
    }
    
    const data = await response.json();
    
    // Redirect to Google OAuth URL
    if (data.url) {
      return reply.redirect(data.url);
    }
    
    return reply.status(400).send({ error: 'No redirect URL' });
  } catch (err) {
    console.error('Google OAuth error:', err);
    return reply.status(500).send({ error: 'OAuth failed' });
  }
});

// Simple test route
fastify.get('/api/auth/test', async (request, reply) => {
  return { ok: true, message: 'Auth route works!' };
});

// Manual logout endpoint - clear session cookie
fastify.post('/api/auth/logout', async (request, reply) => {
  // Clear all session cookies - use array for multiple set-cookie headers
  reply
    .header('set-cookie', [
      'better-auth.session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly',
      'better-auth.session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly'
    ]);
  return { success: true, message: 'Logged out' };
});

// Better Auth handler - manual implementation
fastify.all('/api/auth/*', async (request, reply) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  
  console.log('Auth request path:', url.pathname);
  
  // Build headers
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value && typeof value === 'string') {
      headers.set(key, value);
    }
  }

  // Create request
  const req = new Request(url.toString(), {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : JSON.stringify(request.body)
  });

  try {
    const response = await auth.handler(req);
    
    console.log('Auth response:', response.status, url.pathname);
    
    // Copy status
    reply.status(response.status);
    
    // Copy headers - handle set-cookie specially
    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase() === 'set-cookie') {
        // Get all set-cookie headers
        const cookies = response.headers.getSetCookie ? response.headers.getSetCookie() : [value];
        cookies.forEach(cookie => reply.header('set-cookie', cookie));
      } else {
        reply.header(key, value);
      }
    }
    
    // Send body
    const text = await response.text();
    return reply.send(text);
  } catch (err) {
    console.error('Auth handler error:', err);
    return reply.status(500).send({ error: 'Auth handler failed', details: err.message });
  }
});

// Register API routes
await fastify.register(routes, { prefix: '/api' });

// Global error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  
  reply.status(error.statusCode || 500).send({
    success: false,
    message: error.message || 'Internal Server Error'
  });
});

// Start server
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

start();
