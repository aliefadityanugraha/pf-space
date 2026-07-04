/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.createTable('study_notes', (table) => {
    table.increments('note_id').primary();
    table.string('user_id', 36).notNullable();
    table.integer('film_id').unsigned().notNullable();
    table.float('timestamp').notNullable();
    table.text('content').notNullable();
    table.timestamps(true, true);

    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('film_id').references('film_id').inTable('films').onDelete('CASCADE');
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('study_notes');
}
