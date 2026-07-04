/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable('notifications', function(table) {
    table.increments('id').primary();
    table.string('user_id').notNullable().index(); // Foreign key to users
    table.string('type').notNullable(); // vote, comment, reply, system
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.boolean('is_read').defaultTo(false);
    
    // Polymorphic relation support or just generic data
    table.jsonb('data').nullable(); // Store related info like { film_id: 1, comment_id: 2 }
    
    table.timestamps(true, true);
    
    // Foreign key constraint (assuming users table exists and uses string id)
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTableIfExists('notifications');
}
