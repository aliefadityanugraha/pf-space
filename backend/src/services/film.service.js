import { Film } from '../models/index.js';

export class FilmService {
  async getAll(options = {}) {
    const { 
      page = 1, 
      limit = 10, 
      status = 'published',
      category_id,
      search,
      user_id,
      sortBy = 'created_at',
      sortOrder = 'desc',
      requesting_user_id,
      is_banner_active
    } = options;

    const query = Film.query()
      .withGraphFetched('[creator(selectBasic), category]')
      .modifiers({
        selectBasic(builder) {
          builder.select('id', 'name', 'image');
        }
      });

    // Helper to apply filters to both main and count queries
    const applyFilters = (q) => {
      // 1. Handle Status & Access Control
      if (status) {
        if (status === 'published' && requesting_user_id) {
          // Public shows published, but owner sees their own too
          q.where(builder => {
            builder.where('status', 'published')
                   .orWhere('user_id', requesting_user_id);
          });
        } else {
          q.where('status', status);
        }
      }

      // 2. Explicit User Filter
      if (user_id) {
        q.where('user_id', user_id);
      }

      // 3. Category Filter
      if (category_id) {
        q.where('category_id', category_id);
      }

      // 4. Search by title or synopsis (Case-Insensitive)
      if (search && String(search).trim()) {
        const term = `%${String(search).trim()}%`;
        q.where(builder => {
          builder.where('judul', 'like', term)
                 .orWhere('sinopsis', 'like', term);
        });
      }

      // 5. Banner Filter
      if (is_banner_active !== undefined) {
        q.where('is_banner_active', is_banner_active);
      }
    };

    applyFilters(query);

    // Sorting
    query.orderBy(sortBy || 'created_at', sortOrder || 'desc');

    // Pagination
    const offset = (page - 1) * limit;
    
    // Count query
    const countQuery = Film.query();
    applyFilters(countQuery);

    const [films, totalResult] = await Promise.all([
      query.limit(limit).offset(offset),
      countQuery.count('film_id as total').first()
    ]);

    const total = parseInt(totalResult?.total || 0);

    return {
      films,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getById(id) {
    return Film.query()
      .findById(id)
      .withGraphFetched('[creator(selectBasic), category]')
      .modifiers({
        selectBasic(builder) {
          builder.select('id', 'name', 'image');
        }
      });
  }

  async getBySlug(slug) {
    return Film.query()
      .where('slug', slug)
      .withGraphFetched('[creator(selectBasic), category]')
      .modifiers({
        selectBasic(builder) {
          builder.select('id', 'name', 'image');
        }
      })
      .first();
  }

  async create(data) {
    // Insert film first
    const film = await Film.query().insert(data);
    
    // Generate and update slug with ID
    const slug = Film.generateSlug(data.judul, film.film_id);
    await Film.query().findById(film.film_id).patch({ slug });
    
    return { ...film, slug };
  }

  async update(id, data) {
    // If judul changed, regenerate slug
    if (data.judul) {
      data.slug = Film.generateSlug(data.judul, id);
    }
    return Film.query().patchAndFetchById(id, data);
  }

  async delete(id) {
    return Film.query().deleteById(id);
  }

  async updateStatus(id, status, extra = {}) {
    return Film.query().patchAndFetchById(id, { status, ...extra });
  }

  async getByCreator(userId, options = {}) {
    return this.getAll({ ...options, user_id: userId, status: null });
  }

  async getLatest(limit = 10) {
    return Film.query()
      .where('status', 'published')
      .withGraphFetched('[creator(selectBasic), category]')
      .modifiers({
        selectBasic(builder) {
          builder.select('id', 'name', 'image');
        }
      })
      .orderBy('created_at', 'desc')
      .limit(limit);
  }

  async getPending() {
    return Film.query()
      .where('status', 'pending')
      .withGraphFetched('[creator(selectBasic), category]')
      .modifiers({
        selectBasic(builder) {
          builder.select('id', 'name', 'image');
        }
      })
      .orderBy('created_at', 'asc');
  }
}

export const filmService = new FilmService();
