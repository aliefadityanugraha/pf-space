export async function up(knex) {
  // Increase image length for users table
  await knex.schema.alterTable('users', (table) => {
    table.text('image').alter();
  });

  // Increase value length for verifications table
  await knex.schema.alterTable('verifications', (table) => {
    table.text('value').alter();
  });
}

export async function down(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.string('image', 255).alter();
  });

  await knex.schema.alterTable('verifications', (table) => {
    table.string('value', 255).alter();
  });
}
