/**
 * src/middlewares/viewLimit.middleware.js
 * 
 * IP-based rate limiter for film view count endpoint.
 * Prevents view count inflation by limiting each IP to 
 * one view increment per film within a cooldown window.
 * 
 * Uses an in-memory store — suitable for single-instance deployments.
 * For multi-instance, consider using Redis instead.
 */

/** @type {Map<string, number>} key: "ip:filmId" → value: timestamp (ms) */
const viewStore = new Map();

/** Cooldown period: 1 view per IP per film every 5 minutes */
const VIEW_COOLDOWN_MS = 5 * 60 * 1000;

/** Clean up expired entries every 10 minutes to prevent memory leak */
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

// Periodic cleanup of expired entries
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of viewStore) {
    if (now - timestamp > VIEW_COOLDOWN_MS) {
      viewStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS).unref(); // .unref() so it doesn't keep the process alive

/**
 * Extract the real client IP from the request,
 * considering reverse proxy headers.
 * @param {import('fastify').FastifyRequest} request
 * @returns {string} Client IP address
 */
function getClientIp(request) {
  const forwarded = request.headers['x-forwarded-for'];
  if (forwarded) {
    // x-forwarded-for can be "client, proxy1, proxy2" — take the first
    return String(forwarded).split(',')[0].trim();
  }
  return request.ip || 'unknown';
}

/**
 * Middleware that limits view count increments to once per IP per film
 * within the cooldown window. If rate-limited, returns 429.
 * 
 * @param {import('fastify').FastifyRequest} request
 * @param {import('fastify').FastifyReply} reply
 */
export const viewRateLimit = async (request, reply) => {
  const filmId = request.params.id;
  const clientIp = getClientIp(request);
  const key = `${clientIp}:${filmId}`;
  
  const lastView = viewStore.get(key);
  const now = Date.now();

  if (lastView && (now - lastView) < VIEW_COOLDOWN_MS) {
    const retryAfterSec = Math.ceil((VIEW_COOLDOWN_MS - (now - lastView)) / 1000);
    
    reply.header('Retry-After', retryAfterSec);
    return reply.status(429).send({
      success: false,
      message: 'View already counted. Please try again later.',
      retryAfter: retryAfterSec
    });
  }

  // Record this view
  viewStore.set(key, now);
};
