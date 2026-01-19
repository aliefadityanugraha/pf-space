export async function up(knex) {
  await knex.schema.alterTable('films', (table) => {
    table.string('banner_url').nullable();
    table.boolean('is_banner_active').defaultTo(false);
  });
}

export async function down(knex) {
  await knex.schema.alterTable('films', (table) => {
    table.dropColumn('banner_url');
    table.dropColumn('is_banner_active');
  });
}
