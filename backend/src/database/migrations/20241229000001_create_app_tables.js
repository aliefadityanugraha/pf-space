export async function up(knex) {
  // Categories table
  await knex.schema.createTable('categories', (table) => {
    table.increments('category_id').primary();
    table.string('nama_kategori').notNullable();
    table.text('deskripsi').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Films table
  await knex.schema.createTable('films', (table) => {
    table.increments('film_id').primary();
    table.string('user_id', 36).notNullable();
    table.integer('category_id').unsigned().nullable();
    table.string('judul').notNullable();
    table.text('sinopsis').nullable();
    table.smallint('tahun_karya').unsigned().nullable();
    table.string('link_video_utama').nullable();
    table.string('link_trailer').nullable();
    table.string('gambar_poster').nullable();
    table.text('filosofi_poster').nullable();
    table.string('file_naskah').nullable();
    table.string('file_storyboard').nullable();
    table.string('file_rab').nullable();
    table.json('crew').nullable();
    table.enum('status', ['pending', 'published', 'rejected']).defaultTo('pending');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('category_id').references('category_id').inTable('categories').onDelete('SET NULL');
    
    table.index('user_id');
    table.index('category_id');
    table.index('status');
  });

  // Discussions table
  await knex.schema.createTable('discussions', (table) => {
    table.increments('diskusi_id').primary();
    table.integer('film_id').unsigned().notNullable();
    table.string('user_id', 36).notNullable();
    table.text('isi_pesan').notNullable();
    table.integer('parent_id').unsigned().nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.foreign('film_id').references('film_id').inTable('films').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('parent_id').references('diskusi_id').inTable('discussions').onDelete('CASCADE');
  });

  // Votes table
  await knex.schema.createTable('votes', (table) => {
    table.increments('vote_id').primary();
    table.integer('film_id').unsigned().notNullable();
    table.string('user_id', 36).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.foreign('film_id').references('film_id').inTable('films').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.unique(['film_id', 'user_id']); // 1 user = 1 vote per film
  });

  // Chat History table
  await knex.schema.createTable('chat_history', (table) => {
    table.increments('chat_id').primary();
    table.string('user_id', 36).notNullable();
    table.text('user_prompt').notNullable();
    table.text('ai_response').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('chat_history');
  await knex.schema.dropTableIfExists('votes');
  await knex.schema.dropTableIfExists('discussions');
  await knex.schema.dropTableIfExists('films');
  await knex.schema.dropTableIfExists('categories');
}
