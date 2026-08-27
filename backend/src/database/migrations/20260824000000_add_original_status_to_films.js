/**
 * backend/src/database/migrations/20260824000000_add_original_status_to_films.js
 *
 * Adds 'original_status' field to the 'films' table to track pre-edit status.
 */

export async function up(knex) {
  return knex.schema.alterTable('films', (table) => {
    table.string('original_status', 20).nullable();
  });
}

export async function down(knex) {
  return knex.schema.alterTable('films', (table) => {
    table.dropColumn('original_status');
  });
}
