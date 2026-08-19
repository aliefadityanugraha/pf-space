/**
 * backend/src/database/migrations/20260820000000_add_transcode_fields_to_films.js
 *
 * Adds HLS transcoding metadata fields to the 'films' table.
 */

export async function up(knex) {
  return knex.schema.alterTable('films', (table) => {
    table
      .enum('transcode_status', ['none', 'pending', 'processing', 'completed', 'failed'])
      .notNullable()
      .defaultTo('none');
    table.string('hls_manifest_url', 512).nullable();
    table.tinyint('transcode_progress').unsigned().notNullable().defaultTo(0);
  });
}

export async function down(knex) {
  return knex.schema.alterTable('films', (table) => {
    table.dropColumn('transcode_status');
    table.dropColumn('hls_manifest_url');
    table.dropColumn('transcode_progress');
  });
}
