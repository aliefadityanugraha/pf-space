/**
 * src/lib/ip.js
 *
 * Shared client IP resolution that is NOT spoofable via X-Forwarded-For.
 *
 * With `trustProxy: true`, Fastify's `request.ip` resolves to the left-most
 * X-Forwarded-For entry, which a client can set arbitrarily. To keep rate
 * limiters and view counters accurate we prefer headers that proxies
 * (nginx / Cloudflare) overwrite with the true remote address:
 *
 *   1. CF-Connecting-IP   → set by Cloudflare, stripped at the edge
 *   2. X-Real-IP          → nginx overwrites this with $remote_addr
 *   3. request.ip         → last resort (direct / LAN access)
 */

/**
 * Resolve the real client IP for a request.
 * @param {import('fastify').FastifyRequest} request
 * @returns {string} Client IP address
 */
export function getClientIp(request) {
  const cfIp = request.headers['cf-connecting-ip'];
  if (typeof cfIp === 'string' && cfIp.trim()) {
    return cfIp.trim();
  }

  const realIp = request.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }

  return request.ip || 'unknown';
}
