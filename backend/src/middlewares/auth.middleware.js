/**
 * src/middlewares/auth.middleware.js
 * 
 * Authentication and authorization hooks. Protects routes by 
 * verifying sessions and checking user roles.
 */

import { auth } from '../lib/auth.js';
import { ROLES } from '../models/index.js';
import { AuthenticationError, AuthorizationError } from '../lib/errors.js';

/**
 * Authenticate request by verifying the session token
 * @param {import('fastify').FastifyRequest} request 
 * @param {import('fastify').FastifyReply} reply 
 * @throws {AuthenticationError} If session is invalid or missing
 */
export const authenticate = async (request, reply) => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      console.warn('Auth Middleware: No session found', {
        url: request.url,
        cookie: request.headers.cookie ? `${request.headers.cookie.substring(0, 20)}...` : 'NONE'
      });
      throw new AuthenticationError('Unauthorized');
    }

    request.user = session.user;
    request.session = session.session;
  } catch (err) {
    if (err instanceof AuthenticationError) throw err;
    
    console.error('Auth middleware error:', err);
    throw new AuthenticationError('Authentication failed');
  }
};

/**
 * Create a middleware that checks if the user has one of the allowed roles
 * @param {...number} allowedRoles - Role IDs that are permitted
 * @returns {Function} Fastify preHandler hook
 */
export const requireRole = (...allowedRoles) => {
  return async (request, reply) => {
    await authenticate(request, reply);
    
    if (reply.sent) return;

    const userRoleId = request.user?.role_id || ROLES.USER;

    // Convert role names to IDs if strings passed
    const allowedRoleIds = allowedRoles.map(role => {
      if (typeof role === 'string') {
        return ROLES[role.toUpperCase()] || role;
      }
      return role;
    });

    // Admin has access to everything
    if (userRoleId === ROLES.ADMIN) return;

    if (!allowedRoleIds.includes(userRoleId)) {
      return reply.status(403).send({
        success: false,
        message: 'Forbidden: insufficient permissions'
      });
    }
  };
};

// Shorthand middlewares
export const requireAdmin = requireRole(ROLES.ADMIN);
export const requireModerator = requireRole(ROLES.MODERATOR, ROLES.ADMIN);
export const requireCreator = requireRole(ROLES.CREATOR, ROLES.MODERATOR, ROLES.ADMIN);

/**
 * Optional authentication — attaches user if session exists, continues if not
 * @param {import('fastify').FastifyRequest} request 
 * @param {import('fastify').FastifyReply} reply 
 */
export const optionalAuth = async (request, reply) => {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });
    
    if (session) {
      request.user = session.user;
      request.session = session.session;
    }
  } catch {
    // Continue without auth
  }
};
