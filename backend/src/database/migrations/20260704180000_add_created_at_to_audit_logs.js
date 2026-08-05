/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  const hasColumn = await knex.schema.hasColumn('audit_logs', 'updated_at');

  if (!hasColumn) {
    await knex.schema.alterTable('audit_logs', (table) => {
      table.timestamp('updated_at').nullable();
    });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  const hasColumn = await knex.schema.hasColumn('audit_logs', 'updated_at');

  if (hasColumn) {
    await knex.schema.alterTable('audit_logs', (table) => {
      table.dropColumn('updated_at');
    });
  }
}
