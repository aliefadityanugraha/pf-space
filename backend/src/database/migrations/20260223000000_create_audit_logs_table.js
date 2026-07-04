/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.createTable('audit_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.string('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('action').notNullable();
    table.string('target_type').notNullable();
    table.string('target_id');
    table.text('details'); // Use text for JSON stringify to be safe across DBs
    table.string('ip_address');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema.dropTable('audit_logs');
};
