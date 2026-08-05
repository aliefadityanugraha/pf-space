export async function up(knex) {
  // Add updated_at to discussions so model timestamps work correctly
  await knex.schema.alterTable('discussions', (table) => {
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.alterTable('discussions', (table) => {
    table.dropColumn('updated_at');
  });
}
