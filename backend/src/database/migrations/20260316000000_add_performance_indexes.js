export function up(knex) {
  return knex.schema
    .alterTable('votes', t => {
      t.unique(['film_id', 'user_id'], 'idx_votes_film_user');
    })
    .alterTable('discussions', t => {
      t.index(['film_id', 'parent_id'], 'idx_discussions_film_parent');
    })
    .alterTable('notifications', t => {
      t.index(['user_id', 'is_read'], 'idx_notifications_user_read');
    })
    .alterTable('films', t => {
      t.index('slug', 'idx_films_slug');
      t.index('status', 'idx_films_status');
    });
}

export function down(knex) {
  return knex.schema
    .alterTable('votes', t => {
      t.dropUnique(['film_id', 'user_id'], 'idx_votes_film_user');
    })
    .alterTable('discussions', t => {
      t.dropIndex(['film_id', 'parent_id'], 'idx_discussions_film_parent');
    })
    .alterTable('notifications', t => {
      t.dropIndex(['user_id', 'is_read'], 'idx_notifications_user_read');
    })
    .alterTable('films', t => {
      t.dropIndex('slug', 'idx_films_slug');
      t.dropIndex('status', 'idx_films_status');
    });
}
