/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.createTable('reports', (table) => {
    table.increments('report_id').primary();
    table.string('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('target_type').notNullable(); // 'film', 'comment', 'discussion', 'reply', 'material'
    table.integer('target_id').unsigned().notNullable();
    table.string('reason').notNullable(); // 'spam', 'harassment', 'inappropriate', 'copyright', 'other'
    table.text('description');
    table.string('status').defaultTo('pending'); // 'pending', 'reviewed', 'resolved', 'rejected'
    table.text('admin_notes');
    table.timestamps(true, true);

    // Index for faster lookups
    table.index(['target_type', 'target_id']);
    table.index('status');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema.dropTableIfExists('reports');
};
