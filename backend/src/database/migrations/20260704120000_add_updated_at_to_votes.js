export async function up(knex) {
  const hasColumn = await knex.schema.hasColumn('votes', 'updated_at');

  if (!hasColumn) {
    await knex.schema.alterTable('votes', (table) => {
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }
}

export async function down(knex) {
  const hasColumn = await knex.schema.hasColumn('votes', 'updated_at');

  if (hasColumn) {
    await knex.schema.alterTable('votes', (table) => {
      table.dropColumn('updated_at');
    });
  }
}
