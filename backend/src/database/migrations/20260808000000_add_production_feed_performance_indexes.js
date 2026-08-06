/**
 * src/database/migrations/20260808000000_add_production_feed_performance_indexes.js
 *
 * Performance pass (docs/feed/PERFORMANCE_PRODUCTION_FEED.md):
 *
 * 1. production_posts — default feed ordering is `is_pinned DESC, created_at DESC,
 *    post_id DESC` on top of the public filter (`status='published' AND
 *    visibility='public'`). Add composite (status, visibility, is_pinned,
 *    created_at, post_id) so the common feed query filters AND sorts via the
 *    index (no filesort). `is_pinned` single-column index is now a redundant
 *    prefix of this composite → dropped to reduce write overhead.
 * 2. users.name — NOT indexed today; the mention lookup `WHERE name IN (...)` in
 *    the comment adapter and `author` prefix search both scan users. Add a
 *    non-unique index (display names are not unique). Leading-wildcard
 *    `LIKE '%...%'` still cannot use it (documented limitation).
 * 3. discussions — add `(post_id, created_at)` so `getByPost` can both filter
 *    by post and sort by created_at without filesort. `getCommentCount` uses the
 *    leading `post_id` column. The single-column `idx_discussions_post` is
 *    KEPT: MySQL requires an index on `post_id` to support the FK
 *    `discussions_post_id_foreign` (dropping it fails with
 *    "needed in a foreign key constraint"), so the single-column index stays as
 *    the FK-supporting index and the composite serves ordered pagination.
 */

export const up = function(knex) {
  return knex.schema
    .alterTable('production_posts', (table) => {
      table.index(['status', 'visibility', 'is_pinned', 'created_at', 'post_id'], 'idx_production_posts_feed_order');
      table.dropIndex('is_pinned', 'idx_production_posts_pin');
    })
    .alterTable('users', (table) => {
      table.index('name', 'idx_users_name');
    })
    .alterTable('discussions', (table) => {
      table.index(['post_id', 'created_at'], 'idx_discussions_post_created');
    });
};

export const down = function(knex) {
  return knex.schema
    .alterTable('production_posts', (table) => {
      table.index('is_pinned', 'idx_production_posts_pin');
      table.dropIndex(['status', 'visibility', 'is_pinned', 'created_at', 'post_id'], 'idx_production_posts_feed_order');
    })
    .alterTable('users', (table) => {
      table.dropIndex('name', 'idx_users_name');
    })
    .alterTable('discussions', (table) => {
      table.dropIndex(['post_id', 'created_at'], 'idx_discussions_post_created');
    });
};
