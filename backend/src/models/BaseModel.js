/**
 * src/models/BaseModel.js
 * 
 * Base model class extending Objection.js Model. 
 * Provides common lifecycle hooks like timestamps for all models,
 * and reusable query modifiers.
 */

import { Model } from 'objection';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class BaseModel extends Model {
  /**
   * Helps Objection.js resolve string-based relationships in ESM mode.
   * @returns {string[]} List of directories where models are located
   */
  static get modelPaths() {
    return [__dirname];
  }

  /**
   * Hook: Auto-set created_at and updated_at before insert
   */
  $beforeInsert() {
    const now = new Date();
    this.created_at = now;
    this.updated_at = now;
  }

  /**
   * Hook: Auto-update updated_at before update
   */
  $beforeUpdate() {
    this.updated_at = new Date();
  }

  /**
   * Reusable query modifiers shared across all models.
   * Usage: .modifiers(BaseModel.defaultModifiers)
   * 
   * - selectBasic: Select only id, name, image from user relations
   * - selectFilm:  Select only film_id, judul from film relations
   */
  static get defaultModifiers() {
    return {
      selectBasic(builder) {
        builder.select('id', 'name', 'image');
      },
      selectFilm(builder) {
        builder.select('film_id', 'judul');
      }
    };
  }
}
