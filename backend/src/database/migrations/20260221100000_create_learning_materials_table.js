/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.createTable('learning_materials', (table) => {
    table.increments('materi_id').primary();
    table.string('judul').notNullable();
    table.text('deskripsi').nullable();
    table.enum('tipe', ['pdf', 'video']).notNullable();
    table.string('file_path').nullable(); // For PDF storage
    table.string('video_url').nullable(); // For YouTube link
    table.string('thumbnail').nullable();
    table.boolean('is_active').defaultTo(true);
    table.string('creator_id', 36).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('creator_id').references('id').inTable('users').onDelete('CASCADE');
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('learning_materials');
}
