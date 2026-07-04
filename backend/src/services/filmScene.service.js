/**
 * src/services/filmScene.service.js
 */

import { FilmScene } from '../models/index.js';

export class FilmSceneService {
  /**
   * Retrieves all scenes for a specific film, ordered by start time.
   * @param {number|string} film_id - The ID of the film.
   * @returns {Promise<Array>} List of FilmScene models.
   */
  async getByFilmId(film_id) {
    return await FilmScene.query()
      .where({ film_id })
      .orderBy('start_time', 'asc');
  }

  /**
   * Inserts a single scene record.
   * @param {Object} data - Scene data.
   * @returns {Promise<Object>} The created FilmScene.
   */
  async create(data) {
    return await FilmScene.query().insert(data);
  }

  /**
   * Updates an existing scene record.
   * @param {number} scene_id - Scene primary key.
   * @param {Object} data - Fields to update.
   * @returns {Promise<Object>} The updated record.
   */
  async update(scene_id, data) {
    return await FilmScene.query().patchAndFetchById(scene_id, data);
  }

  /**
   * Deletes a scene by its ID.
   * @param {number} scene_id - Scene primary key.
   * @returns {Promise<number>} Number of deleted rows.
   */
  async delete(scene_id) {
    return await FilmScene.query().deleteById(scene_id);
  }

  /**
   * Performs an atomic bulk update of a film's scene breakdown.
   * Deletes existing scenes and re-inserts the new list to ensure synchronization.
   * Handles MySQL-specific compatibility for multiple rows.
   * 
   * @param {number} film_id - The target film ID.
   * @param {Array} scenes - Array of scene objects.
   * @returns {Promise<Array>} The refreshed list of scenes.
   */
  async bulkCreate(film_id, scenes) {
    return await FilmScene.transaction(async (trx) => {
      // 1. Clear existing scenes
      await FilmScene.query(trx).delete().where({ film_id });
      
      if (scenes && scenes.length > 0) {
        // 2. Insert scenes one by one to ensure MySQL compatibility 
        // and avoid the "batch insert" dialect error in Objection/Knex
        for (const s of scenes) {
          const start = Number(s.start_time);
          if (isNaN(start)) continue;

          await FilmScene.query(trx).insert({
            film_id: Number(film_id),
            title: String(s.title || 'Untitled').substring(0, 255),
            start_time: start,
            end_time: s.end_time ? Number(s.end_time) : null,
            description: s.description ? String(s.description).substring(0, 1000) : null
          });
        }
      }

      // 3. Return the refreshed list
      return await FilmScene.query(trx)
        .where({ film_id })
        .orderBy('start_time', 'asc');
    });
  }
}

export const filmSceneService = new FilmSceneService();
