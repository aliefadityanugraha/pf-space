/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.table('learning_materials', (table) => {
    table.string('kategori').nullable().index();
    table.boolean('is_featured').defaultTo(false).index();
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.table('learning_materials', (table) => {
    table.dropColumn('kategori');
    table.dropColumn('is_featured');
  });
}
