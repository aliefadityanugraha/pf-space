/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.createTable('film_scenes', (table) => {
    table.increments('scene_id').primary();
    table.integer('film_id').unsigned().notNullable();
    table.string('title', 255).notNullable();
    table.float('start_time').notNullable();
    table.float('end_time').nullable();
    table.text('description').nullable();
    table.timestamps(true, true);

    table.foreign('film_id').references('film_id').inTable('films').onDelete('CASCADE');
    table.index(['film_id', 'start_time']);
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('film_scenes');
}
