/**
 * src/controllers/film.controller.js
 * 
 * Controller for managing films, including listing, creation, 
 * editing, deletion, and approval workflows.
 */

import { filmService } from '../services/index.js';
import { ApiResponse } from '../lib/response.js';
import { ROLES, FILM_STATUS } from '../config/constants.js';
import { NotFoundError } from '../lib/errors.js';
import { recordAuditLog } from '../lib/audit.js';

export class FilmController {
  /**
   * Public: Fetch a paginated list of published films with various filters
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getAll(request, reply) {
    const { page, limit, category_id, search, sortBy, sortOrder, status, is_banner_active } = request.query;

    // Admin and Moderator can filter by any status, public only sees published
    let filterStatus = FILM_STATUS.PUBLISHED;
    if (request.user && (request.user.role_id === ROLES.ADMIN || request.user.role_id === ROLES.MODERATOR)) {
      if (status) {
        filterStatus = status === 'all' ? null : status;
      }
    }

    const options = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      category_id,
      search: search || null,
      sortBy: sortBy || 'films.created_at',
      sortOrder: sortOrder || 'desc',
      status: filterStatus,
      requesting_user_id: request.user?.id,
      is_banner_active: is_banner_active === 'true' ? true : (is_banner_active === 'false' ? false : undefined)
    };

    const result = await filmService.getAll(options);

    return ApiResponse.success(
      reply, 
      result.films, 
      'Films retrieved successfully', 
      200, 
      result.pagination
    );
  }

  /**
   * Public: Fetch a single film by its ID or slug
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getById(request, reply) {
    const { id } = request.params;
    
    // Check if id is numeric (film_id) or string (slug)
    const isNumeric = /^\d+$/.test(id);
    const film = isNumeric 
      ? await filmService.getById(id)
      : await filmService.getBySlug(id);

    if (!film) {
      throw new NotFoundError('Film not found');
    }

    // Only show published films to public, or own films to creator
    if (film.status !== FILM_STATUS.PUBLISHED) {
      if (!request.user || (request.user.id !== film.user_id && request.user.role_id !== ROLES.ADMIN)) {
        throw new NotFoundError('Film not found');
      }
    }

    return ApiResponse.success(reply, film);
  }

  /**
   * Public: Fetch related films based on the current film's category
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getRelated(request, reply) {
    const { id } = request.params;
    const { limit } = request.query;
    
    // Check if id is numeric or slug. If slug, resolve to ID first
    let filmId = id;
    if (!/^\d+$/.test(id)) {
      const film = await filmService.getBySlug(id);
      if (!film) throw new NotFoundError('Film not found');
      filmId = film.film_id;
    }

    const related = await filmService.getRelated(filmId, limit ? parseInt(limit) : 4);
    
    return ApiResponse.success(reply, related);
  }

  /**
   * Public: Fetch films designated for the homepage banner
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getBanners(request, reply) {
    const result = await filmService.getAll({
      status: FILM_STATUS.PUBLISHED,
      is_banner_active: true,
      limit: 10,
      sortBy: 'updated_at',
      sortOrder: 'desc'
    });

    return ApiResponse.success(reply, result.films);
  }

  /**
   * Public: Fetch most recently published films
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getLatest(request, reply) {
    const limit = request.query.limit || 10;
    const films = await filmService.getLatest(limit);
    return ApiResponse.success(reply, films);
  }

  /**
   * Public: Increment the view counter for a film
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async incrementViews(request, reply) {
    const { id } = request.params;
    
    // Check if id is numeric or slug. If slug, resolve to ID first
    let filmId = id;
    if (!/^\d+$/.test(id)) {
      const film = await filmService.getBySlug(id);
      if (!film) throw new NotFoundError('Film not found');
      filmId = film.film_id;
    }

    await filmService.incrementViews(filmId);
    return ApiResponse.success(reply, { success: true });
  }

  /**
   * Protected: Create a new film entry (Creator/Admin)
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async create(request, reply) {
    const data = filmService.normalizeData(request.body);

    const film = await filmService.create({
      ...data,
      user_id: request.user.id,
      status: FILM_STATUS.PENDING
    });

    return ApiResponse.success(reply, film, 'Film created successfully. Waiting for admin approval.', 201);
  }

  /**
   * Creator: Update an existing film entry (Ownership verified)
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async update(request, reply) {
    const { id } = request.params;
    const film = await filmService.getById(id);

    if (!film) {
      throw new NotFoundError('Film not found');
    }

    // Only creator or admin can update
    if (film.user_id !== request.user.id && request.user.role_id !== ROLES.ADMIN) {
      return ApiResponse.error(reply, 'You can only update your own films', 403);
    }

    const updateData = filmService.normalizeData(request.body);

    // Reset to pending if creator updates (needs re-approval)
    if (request.user.role_id !== ROLES.ADMIN && (film.status === FILM_STATUS.PUBLISHED || film.status === FILM_STATUS.REJECTED)) {
      updateData.status = FILM_STATUS.PENDING;
      updateData.rejection_reason = null;
    }

    const updated = await filmService.update(id, updateData);
    return ApiResponse.success(reply, updated, 'Film updated successfully');
  }

  /**
   * Creator: Delete an existing film entry (Ownership verified)
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async delete(request, reply) {
    const { id } = request.params;
    const film = await filmService.getById(id);

    if (!film) {
      throw new NotFoundError('Film not found');
    }

    // Only creator or admin can delete
    if (film.user_id !== request.user.id && request.user.role_id !== ROLES.ADMIN) {
      return ApiResponse.error(reply, 'You can only delete your own films', 403);
    }

    await filmService.delete(id);

    // Audit Log for Admin Deletion
    if (request.user.role_id === ROLES.ADMIN) {
      await recordAuditLog({
        userId: request.user.id,
        action: 'DELETE_FILM',
        targetType: 'film',
        targetId: id,
        details: { title: film.judul, creator_id: film.user_id },
        ipAddress: request.ip
      });
    }

    return ApiResponse.success(reply, null, 'Film deleted successfully');
  }

  /**
   * Creator: Fetch all films uploaded by the current user
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getMyFilms(request, reply) {
    const { page, limit, status } = request.query;

    const result = await filmService.getAll({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      user_id: request.user.id,
      status: status || null
    });

    return ApiResponse.success(
      reply, 
      result.films, 
      'My films retrieved successfully', 
      200, 
      result.pagination
    );
  }

  /**
   * Admin: Fetch a list of films waiting for approval
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getPending(request, reply) {
    const films = await filmService.getPending();
    return ApiResponse.success(reply, films);
  }

  /**
   * Admin: Approve and publish a pending film
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async approve(request, reply) {
    const { id } = request.params;
    const film = await filmService.getById(id);

    if (!film) {
      throw new NotFoundError('Film not found');
    }

    const updated = await filmService.updateStatus(id, FILM_STATUS.PUBLISHED, { rejection_reason: null });

    // Audit Log
    await recordAuditLog({
      userId: request.user.id,
      action: 'APPROVE_FILM',
      targetType: 'film',
      targetId: id,
      details: { title: film.judul },
      ipAddress: request.ip
    });

    return ApiResponse.success(reply, updated, 'Film approved and published');
  }

  /**
   * Admin: Reject a pending film with a reason
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async reject(request, reply) {
    const { id } = request.params;
    
    const film = await filmService.getById(id);

    if (!film) {
      throw new NotFoundError('Film not found');
    }

    const updated = await filmService.updateStatus(id, FILM_STATUS.REJECTED, {
      rejection_reason: request.body.rejection_reason
    });

    // Audit Log
    await recordAuditLog({
      userId: request.user.id,
      action: 'REJECT_FILM',
      targetType: 'film',
      targetId: id,
      details: { title: film.judul, reason: request.body.rejection_reason },
      ipAddress: request.ip
    });

    return ApiResponse.success(reply, updated, 'Film rejected');
  }
}

export const filmController = new FilmController();
