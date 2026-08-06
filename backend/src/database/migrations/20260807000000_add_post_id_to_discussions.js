/**
 * src/database/migrations/20260807000000_add_post_id_to_discussions.js
 *
 * Adapter migration: enables the existing comment system (`discussions`)
 * to host Production Feed comments by adding a nullable `post_id` column.
 *
 * - `film_id` becomes nullable: a discussion row is now either a film
 *   comment (film_id set) or a production post comment (post_id set).
 * - FK ON DELETE CASCADE: hard-deleting a post removes its comments.
 */

export const up = function(knex) {
  return knex.schema.alterTable('discussions', (table) => {
    table.integer('film_id').unsigned().nullable().alter();
    table.integer('post_id').unsigned().nullable();
    table.foreign('post_id').references('post_id').inTable('production_posts').onDelete('CASCADE');
    table.index('post_id', 'idx_discussions_post');
  });
};

export const down = function(knex) {
  return knex.schema.alterTable('discussions', (table) => {
    table.dropIndex('post_id', 'idx_discussions_post');
    table.dropForeign('post_id');
    table.dropColumn('post_id');
    table.integer('film_id').unsigned().notNullable().alter();
  });
};
