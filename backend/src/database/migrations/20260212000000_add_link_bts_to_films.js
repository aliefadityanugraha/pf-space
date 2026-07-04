export async function up(knex) {
  await knex.schema.alterTable('films', (table) => {
    table.string('link_bts').nullable().after('link_trailer');
  });
}

export async function down(knex) {
  await knex.schema.alterTable('films', (table) => {
    table.dropColumn('link_bts');
  });
}
