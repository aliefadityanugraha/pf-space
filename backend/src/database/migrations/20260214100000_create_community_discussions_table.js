export async function up(knex) {
  // Community discussions table (topics created by admin/moderator)
  await knex.schema.createTable('community_discussions', (table) => {
    table.increments('discussion_id').primary();
    table.string('user_id').notNullable();
    table.string('title').notNullable();
    table.text('description').nullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);

    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.index('is_active');
  });

  // Community discussion replies
  await knex.schema.createTable('community_replies', (table) => {
    table.increments('reply_id').primary();
    table.integer('discussion_id').unsigned().notNullable();
    table.string('user_id').notNullable();
    table.text('content').notNullable();
    table.timestamps(true, true);

    table.foreign('discussion_id').references('discussion_id').inTable('community_discussions').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.index('discussion_id');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('community_replies');
  await knex.schema.dropTableIfExists('community_discussions');
}
