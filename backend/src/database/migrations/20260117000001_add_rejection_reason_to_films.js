export async function up(knex) {
  await knex.schema.alterTable('films', (table) => {
    table.text('rejection_reason').nullable().after('status');
  });
}

export async function down(knex) {
  await knex.schema.alterTable('films', (table) => {
    table.dropColumn('rejection_reason');
  });
}

