export async function up(knex) {
  await knex.schema.alterTable('films', (table) => {
    table.text('embedding').nullable().after('views');
  });
}

export async function down(knex) {
  await knex.schema.alterTable('films', (table) => {
    table.dropColumn('embedding');
  });
}
