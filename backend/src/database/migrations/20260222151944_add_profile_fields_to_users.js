/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.table('users', (table) => {
    table.text('bio').nullable();
    table.string('website').nullable();
    table.string('location').nullable();
    table.string('instagram').nullable();
    table.string('linkedin').nullable();
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.table('users', (table) => {
    table.dropColumn('bio');
    table.dropColumn('website');
    table.dropColumn('location');
    table.dropColumn('instagram');
    table.dropColumn('linkedin');
  });
}
