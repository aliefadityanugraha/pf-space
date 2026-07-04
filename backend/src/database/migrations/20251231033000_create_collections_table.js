/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.createTable('collections', (table) => {
    table.increments('collection_id').primary();
    table.integer('film_id').unsigned().notNullable()
      .references('film_id').inTable('films').onDelete('CASCADE');
    table.string('user_id').notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Ensure a user can only bookmark a film once
    table.unique(['film_id', 'user_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema.dropTable('collections');
};
