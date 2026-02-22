/**
 * src/controllers/auth.controller.js
 * 
 * Controller for authentication endpoints including registration, 
 * login, and user profile management.
 */

import { authService } from '../services/index.js';
import { saveFile } from '../lib/upload.js';
import { ApiResponse } from '../lib/response.js';
import { auth } from '../lib/auth.js';
import { updateProfileSchema } from '../lib/validation.js';
import { NotFoundError, ValidationError } from '../lib/errors.js';
import { recordAuditLog } from '../lib/audit.js';

export class AuthController {
  /**
   * Get the currently authenticated user's profile
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getProfile(request, reply) {
    const user = await authService.getUserById(request.user.id);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return ApiResponse.success(reply, {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.image,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt
    });
  }

  /**
   * Update a user's role (Admin only)
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async updateRole(request, reply) {
    const { userId } = request.params;
    const oldUser = await authService.getUserById(userId);
    
    const user = await authService.updateUserRole(userId, request.body.role_id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Audit Log
    await recordAuditLog({
      userId: request.user.id,
      action: 'UPDATE_ROLE',
      targetType: 'user',
      targetId: userId,
      details: { 
        email: user.email, 
        old_role: oldUser?.role_id, 
        new_role: request.body.role_id 
      },
      ipAddress: request.ip
    });

    return ApiResponse.success(reply, user, 'Role updated successfully');
  }

  /**
   * Update user profile (name and avatar). Handles both JSON and Multipart.
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async updateUser(request, reply) {
    let name;
    let imagePath;

    if (request.isMultipart && request.isMultipart()) {
      const parts = request.parts();

      for await (const part of parts) {
        if (part.type === 'file' && part.fieldname === 'image') {
          imagePath = await saveFile(part, 'avatars');
        } else if (part.type === 'field' && part.fieldname === 'name') {
          name = part.value;
        }
      }
    } else if (request.body) {
      name = request.body.name;
    }

    const updateData = {};
    
    // Validate only if name is provided (partial update)
    if (name !== undefined) {
      const result = updateProfileSchema.safeParse({ name });
      
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        throw new ValidationError('Validation failed', errors);
      }
      
      updateData.name = result.data.name;
    }

    if (imagePath) {
      // Store relative path only, frontend will handle full URL construction
      updateData.image = imagePath;
    }

    const user = await authService.updateUser(request.user.id, updateData);

    return ApiResponse.success(reply, user, 'Profile updated successfully');
  }

  /**
   * Get a list of all users (Admin only)
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getAllUsers(request, reply) {
    const users = await authService.getAllUsers();
    return ApiResponse.success(reply, users);
  }

  /**
   * Get all defined system roles (Admin only)
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getAllRoles(request, reply) {
    const roles = await authService.getAllRoles();
    return ApiResponse.success(reply, roles);
  }

  /**
   * Initiate Google OAuth sign-in flow
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async googleAuth(request, reply) {
    const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
    const url = new URL('/api/auth/sign-in/social', baseURL);
    
    // Forward relevant headers
    const headers = new Headers();
    const headersToForward = ['cookie', 'user-agent', 'x-forwarded-for', 'referer'];
    for (const h of headersToForward) {
      if (request.headers[h]) {
        headers.set(h, request.headers[h]);
      }
    }
    headers.set('Content-Type', 'application/json');
    headers.set('Origin', baseURL); // Better Auth expects this for security

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
      
      // Handle multiple Set-Cookie headers correctly (crucial for CSRF tokens)
      const setCookies = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
      if (setCookies.length > 0) {
        reply.header('set-cookie', setCookies);
      }
      
      const data = await response.json();
      
      if (data.url) {
        return reply.redirect(data.url);
      }
      
      console.error('Better Auth did not return a redirect URL:', data);
      return ApiResponse.badRequest(reply, 'No redirect URL returned from auth provider');
    } catch (err) {
      console.error('Google OAuth error:', err);
      return ApiResponse.error(reply, 'OAuth failed');
    }
  }

  /**
   * Log out user by clearing session cookies
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async logout(request, reply) {
    const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
    const url = new URL('/api/auth/sign-out', baseURL);
    
    const headers = new Headers();
    if (request.headers.cookie) headers.set('cookie', request.headers.cookie);
    headers.set('Content-Type', 'application/json');
    headers.set('Origin', baseURL);

    try {
      const response = await auth.handler(new Request(url.toString(), {
        method: 'POST',
        headers
      }));

      const setCookies = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
      if (setCookies.length > 0) {
        reply.header('set-cookie', setCookies);
      }

      return ApiResponse.success(reply, null, 'Logged out');
    } catch (err) {
      console.error('Logout error:', err);
      // Fallback: Clear cookies manually if Better-Auth fails
      reply.header('set-cookie', [
        'better-auth.session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax; Secure',
        'better-auth.session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax; Secure'
      ]);
      return ApiResponse.success(reply, null, 'Logged out (fallback)');
    }
  }

  /**
   * Catch-all proxy handler for Better Auth internal API routes
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async handleAuth(request, reply) {
    const protocol = request.protocol || 'http';
    const host = request.headers.host;
    const url = new URL(request.url, `${protocol}://${host}`);
    
    // Forward ALL headers
    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (value) {
        if (Array.isArray(value)) {
          value.forEach(v => headers.append(key, v));
        } else {
          headers.set(key, value);
        }
      }
    }

    // Set Origin and Referer for security checks
    const baseURL = process.env.BETTER_AUTH_URL || `http://${host}`;
    headers.set('Origin', baseURL);

    const options = {
      method: request.method,
      headers
    };

    if (!['GET', 'HEAD'].includes(request.method) && request.body) {
      options.body = JSON.stringify(request.body);
    }

    try {
      const response = await auth.handler(new Request(url.toString(), options));
      
      // Set status code
      reply.status(response.status);
      
      // Handle multiple Set-Cookie headers correctly
      const setCookies = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
      if (setCookies.length > 0) {
        // Fastify handles multiple set-cookie headers when passed as an array
        reply.header('set-cookie', setCookies);
      }
      
      // Copy other headers
      for (const [key, value] of response.headers.entries()) {
        const lowerKey = key.toLowerCase();
        if (lowerKey !== 'set-cookie' && lowerKey !== 'content-length') {
          reply.header(key, value);
        }
      }
      
      const text = await response.text();
      return reply.send(text);
    } catch (err) {
      console.error('Auth handler error:', err);
      return ApiResponse.error(reply, 'Auth handler failed', 500, err.message);
    }
  }
}

export const authController = new AuthController();
