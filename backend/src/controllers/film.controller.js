import { filmService } from '../services/index.js';
import { ROLES } from '../models/index.js';
import { deleteFile } from '../lib/upload.js';

export class FilmController {
  // Public: Get all published films (or all films for admin)
  async getAll(request, reply) {
    const { page, limit, category_id, search, sortBy, sortOrder, status, is_banner_active } = request.query;

    // Admin and Moderator can filter by any status, public only sees published
    let filterStatus = 'published';
    if (request.user && (request.user.role_id === ROLES.ADMIN || request.user.role_id === ROLES.MODERATOR)) {
      if (status) {
        filterStatus = status === 'all' ? null : status;
      }
    }

    try {
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

      return reply.send({
        success: true,
        data: result.films,
        pagination: result.pagination
      });
    } catch (err) {
      console.error('Film search error:', err);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error during search'
      });
    }
  }

  // Public: Get single film by ID or slug
  async getById(request, reply) {
    const { id } = request.params;
    
    // Check if id is numeric (film_id) or string (slug)
    const isNumeric = /^\d+$/.test(id);
    const film = isNumeric 
      ? await filmService.getById(id)
      : await filmService.getBySlug(id);

    if (!film) {
      return reply.status(404).send({
        success: false,
        message: 'Film not found'
      });
    }

    // Only show published films to public, or own films to creator
    if (film.status !== 'published') {
      if (!request.user || (request.user.id !== film.user_id && request.user.role_id !== ROLES.ADMIN)) {
        return reply.status(404).send({
          success: false,
          message: 'Film not found'
        });
      }
    }

    return reply.send({
      success: true,
      data: film
    });
  }

  // Public: Get banner films
  async getBanners(request, reply) {
    try {
      const result = await filmService.getAll({
        status: 'published',
        is_banner_active: true,
        limit: 10,
        sortBy: 'updated_at', // Latest updated first? or created_at
        sortOrder: 'desc'
      });

      return reply.send({
        success: true,
        data: result.films
      });
    } catch (err) {
      console.error('Get banners error:', err);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Public: Get latest films
  async getLatest(request, reply) {
    const limit = request.query.limit || 10;
    const films = await filmService.getLatest(limit);

    return reply.send({
      success: true,
      data: films
    });
  }

  // Creator: Create new film
  async create(request, reply) {
    const {
      category_id,
      judul,
      sinopsis,
      tahun_karya,
      link_video_utama,
      link_trailer,
      gambar_poster,
      deskripsi_lengkap,
      file_naskah,
      file_storyboard,
      file_rab,
      crew,
      banner_url
    } = request.body;

    if (!judul) {
      return reply.status(400).send({
        success: false,
        message: 'judul is required'
      });
    }

    const film = await filmService.create({
      user_id: request.user.id,
      category_id,
      judul,
      sinopsis,
      tahun_karya,
      link_video_utama,
      link_trailer,
      gambar_poster,
      banner_url,
      deskripsi_lengkap,
      file_naskah,
      file_storyboard,
      file_rab,
      crew: crew || null,
      status: 'pending'
    });

    return reply.status(201).send({
      success: true,
      message: 'Film created successfully. Waiting for admin approval.',
      data: film
    });
  }

  // Creator: Update own film
  async update(request, reply) {
    const { id } = request.params;
    const film = await filmService.getById(id);

    if (!film) {
      return reply.status(404).send({
        success: false,
        message: 'Film not found'
      });
    }

    // Only creator or admin can update
    if (film.user_id !== request.user.id && request.user.role_id !== ROLES.ADMIN) {
      return reply.status(403).send({
        success: false,
        message: 'You can only update your own films'
      });
    }

    const {
      category_id,
      judul,
      sinopsis,
      tahun_karya,
      link_video_utama,
      link_trailer,
      gambar_poster,
      deskripsi_lengkap,
      file_naskah,
      file_storyboard,
      file_rab,
      crew,
      banner_url,
      is_banner_active
    } = request.body;

    const updateData = {};
    if (category_id !== undefined) updateData.category_id = category_id;
    if (judul !== undefined) updateData.judul = judul;
    if (sinopsis !== undefined) updateData.sinopsis = sinopsis;
    if (tahun_karya !== undefined) updateData.tahun_karya = tahun_karya;
    if (link_video_utama !== undefined) updateData.link_video_utama = link_video_utama;
    if (link_trailer !== undefined) updateData.link_trailer = link_trailer;
    if (gambar_poster !== undefined) updateData.gambar_poster = gambar_poster;
    if (deskripsi_lengkap !== undefined) updateData.deskripsi_lengkap = deskripsi_lengkap;
    if (file_naskah !== undefined) updateData.file_naskah = file_naskah;
    if (file_storyboard !== undefined) updateData.file_storyboard = file_storyboard;
    if (file_rab !== undefined) updateData.file_rab = file_rab;
    if (crew !== undefined) updateData.crew = crew;
    if (banner_url !== undefined) updateData.banner_url = banner_url;

    // Admin only fields
    if (request.user.role_id === ROLES.ADMIN) {
      if (is_banner_active !== undefined) {
        // Handle boolean/string/integer input from FormData
        updateData.is_banner_active = String(is_banner_active) === 'true' || String(is_banner_active) === '1';
      }
    }

    // Delete old files if they are being updated
    if (gambar_poster && film.gambar_poster && gambar_poster !== film.gambar_poster) {
      await deleteFile(film.gambar_poster);
    }
    if (banner_url && film.banner_url && banner_url !== film.banner_url) {
      await deleteFile(film.banner_url);
    }
    if (file_naskah && film.file_naskah && file_naskah !== film.file_naskah) {
      await deleteFile(film.file_naskah);
    }
    if (file_storyboard && film.file_storyboard && file_storyboard !== film.file_storyboard) {
      await deleteFile(film.file_storyboard);
    }
    if (file_rab && film.file_rab && file_rab !== film.file_rab) {
      await deleteFile(film.file_rab);
    }

    // Reset to pending if creator updates (needs re-approval)
    if (request.user.role_id !== ROLES.ADMIN && (film.status === 'published' || film.status === 'rejected')) {
      updateData.status = 'pending';
      updateData.rejection_reason = null; // Clear rejection reason
      console.log(`Film ${id} status reset to pending due to creator update`);
    }

    const updated = await filmService.update(id, updateData);

    return reply.send({
      success: true,
      message: 'Film updated successfully',
      data: updated
    });
  }

  // Creator: Delete own film
  async delete(request, reply) {
    const { id } = request.params;
    const film = await filmService.getById(id);

    if (!film) {
      return reply.status(404).send({
        success: false,
        message: 'Film not found'
      });
    }

    // Only creator or admin can delete
    if (film.user_id !== request.user.id && request.user.role_id !== ROLES.ADMIN) {
      return reply.status(403).send({
        success: false,
        message: 'You can only delete your own films'
      });
    }

    // Delete associated files
    if (film.gambar_poster) await deleteFile(film.gambar_poster);
    if (film.banner_url) await deleteFile(film.banner_url);
    if (film.file_naskah) await deleteFile(film.file_naskah);
    if (film.file_storyboard) await deleteFile(film.file_storyboard);
    if (film.file_rab) await deleteFile(film.file_rab);

    await filmService.delete(id);

    return reply.send({
      success: true,
      message: 'Film deleted successfully'
    });
  }

  // Creator: Get my films
  async getMyFilms(request, reply) {
    const { page, limit, status } = request.query;

    const result = await filmService.getAll({
      page,
      limit,
      user_id: request.user.id,
      status: status || null
    });

    return reply.send({
      success: true,
      data: result.films,
      pagination: result.pagination
    });
  }

  // Admin: Get pending films
  async getPending(request, reply) {
    const films = await filmService.getPending();

    return reply.send({
      success: true,
      data: films
    });
  }

  // Admin: Approve film
  async approve(request, reply) {
    const { id } = request.params;
    const film = await filmService.getById(id);

    if (!film) {
      return reply.status(404).send({
        success: false,
        message: 'Film not found'
      });
    }

    const updated = await filmService.updateStatus(id, 'published', { rejection_reason: null });

    return reply.send({
      success: true,
      message: 'Film approved and published',
      data: updated
    });
  }

  // Admin: Reject film
  async reject(request, reply) {
    const { id } = request.params;
    const { rejection_reason } = request.body || {};
    const film = await filmService.getById(id);

    if (!film) {
      return reply.status(404).send({
        success: false,
        message: 'Film not found'
      });
    }

    const updated = await filmService.updateStatus(id, 'rejected', {
      rejection_reason: rejection_reason || null
    });

    return reply.send({
      success: true,
      message: 'Film rejected',
      data: updated
    });
  }
}

export const filmController = new FilmController();
