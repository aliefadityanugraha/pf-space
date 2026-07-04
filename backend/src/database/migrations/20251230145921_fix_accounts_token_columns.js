/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.alterTable('accounts', (table) => {
    table.text('accessToken').alter();
    table.text('refreshToken').alter();
    table.text('idToken').alter();
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.alterTable('accounts', (table) => {
    table.string('accessToken', 255).alter();
    table.string('refreshToken', 255).alter();
    table.string('idToken', 255).alter();
  });
}
