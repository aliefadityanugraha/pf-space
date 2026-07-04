export async function up(knex) {
  await knex.schema.createTable('carousel_items', (table) => {
    table.increments('id').primary();
    table.string('title').nullable();
    table.string('summary').nullable();
    table.text('quote').nullable();
    table.string('image_url').notNullable();
    table.integer('film_id').unsigned().nullable();
    table.integer('order').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('film_id').references('film_id').inTable('films').onDelete('SET NULL');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('carousel_items');
}
