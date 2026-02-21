/**
 * src/models/BaseModel.js
 * 
 * Base model class extending Objection.js Model. 
 * Provides common lifecycle hooks like timestamps for all models,
 * and reusable query modifiers.
 */

import { Model } from 'objection';

export class BaseModel extends Model {
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
