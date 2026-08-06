/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema
    .createTable('production_posts', (table) => {
      table.increments('post_id').primary();
      table.string('user_id', 36).notNullable();
      table.integer('film_id').unsigned().nullable();
      table.integer('category_id').unsigned().nullable();
      table.string('judul').notNullable();
      table.string('slug', 255).nullable();
      table.text('isi_konten').notNullable();
      table.enum('tipe', ['progress', 'behind_the_scenes', 'casting', 'announcement', 'wrap']).notNullable().defaultTo('progress');
      table.enum('status', ['draft', 'published', 'archived']).notNullable().defaultTo('draft');
      table.enum('visibility', ['public', 'private']).notNullable().defaultTo('public');
      table.string('gambar_cover', 500).nullable();
      table.boolean('is_pinned').notNullable().defaultTo(false);
      table.timestamp('published_at').nullable();
      table.timestamp('deleted_at').nullable();
      table.timestamps(true, true);

      table.unique(['slug'], { indexName: 'idx_production_posts_slug' });
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('film_id').references('film_id').inTable('films').onDelete('SET NULL');
      table.foreign('category_id').references('category_id').inTable('categories').onDelete('SET NULL');

      table.index(['status', 'visibility', 'published_at'], 'idx_production_posts_feed');
      table.index(['user_id', 'published_at'], 'idx_production_posts_user_published');
      table.index('film_id', 'idx_production_posts_film');
      table.index('category_id', 'idx_production_posts_category');
      table.index('is_pinned', 'idx_production_posts_pin');
    })
    .createTable('production_post_media', (table) => {
      table.increments('media_id').primary();
      table.integer('post_id').unsigned().notNullable();
      table.enum('media_type', ['photo', 'video', 'pdf']).notNullable();
      table.string('file_path', 500).notNullable();
      table.string('mime_type', 100).nullable();
      table.bigint('file_size').unsigned().nullable();
      table.string('thumbnail', 500).nullable();
      table.smallint('duration').unsigned().nullable();
      table.smallint('sort_order').unsigned().notNullable().defaultTo(0);
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.foreign('post_id').references('post_id').inTable('production_posts').onDelete('CASCADE');
      table.index(['post_id', 'sort_order'], 'idx_pp_media_post_order');
    })
    .createTable('tags', (table) => {
      table.increments('tag_id').primary();
      table.string('nama_tag', 100).notNullable();
      table.string('slug', 120).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.unique(['nama_tag'], { indexName: 'idx_tags_name' });
      table.unique(['slug'], { indexName: 'idx_tags_slug' });
    })
    .createTable('production_post_tags', (table) => {
      table.integer('post_id').unsigned().notNullable();
      table.integer('tag_id').unsigned().notNullable();
      table.primary(['post_id', 'tag_id']);

      table.foreign('post_id').references('post_id').inTable('production_posts').onDelete('CASCADE');
      table.foreign('tag_id').references('tag_id').inTable('tags').onDelete('CASCADE');
      table.index('tag_id', 'idx_pp_tags_tag');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema
    .dropTableIfExists('production_post_tags')
    .dropTableIfExists('tags')
    .dropTableIfExists('production_post_media')
    .dropTableIfExists('production_posts');
};
