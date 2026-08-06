# 🧱 Migration — Production Feed

> Implementasi migration untuk bounded context **Production Feed**, sesuai `docs/feed/DATABASE_PRODUCTION_FEED.md`.
>
> - **Hanya migration** — tidak ada controller, service, atau route (sesuai GLOBAL RULES).
> - Mengikuti **Database Standard** project (MySQL, Knex, snake_case, FK eksplisit, index `idx_<table>_<kolom>`).
> - Rollback aman: `down` memakai `dropTableIfExists` dengan urutan terbalik (anak → induk).
>
> File migration:
> - `backend/src/database/migrations/20260806000000_create_production_feed_tables.js` — 4 tabel feed.
> - `backend/src/database/migrations/20260807000000_add_post_id_to_discussions.js` — adapter komentar (`discussions.post_id`).
> - `backend/src/database/migrations/20260808000000_add_production_feed_performance_indexes.js` — **index performa** (analisis & keputusan: `docs/feed/PERFORMANCE_PRODUCTION_FEED.md`).

---

## 1. Migration 1 — tabel feed

```js
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
```

### Ringkasan isi migration 1

| Tabel | Dibuat | FK (onDelete) | Unique / Index |
|---|---|---|---|
| `production_posts` | ✔ | `user_id→users` (CASCADE), `film_id→films` (SET NULL), `category_id→categories` (SET NULL) | UNIQUE `slug`; index feed, user_published, film, category, pin |
| `production_post_media` | ✔ | `post_id→production_posts` (CASCADE) | index `(post_id, sort_order)` |
| `tags` | ✔ | — | UNIQUE `nama_tag`, `slug` |
| `production_post_tags` | ✔ | `post_id→production_posts` (CASCADE), `tag_id→tags` (CASCADE) | PK komposit `(post_id, tag_id)`, index `tag_id` |

> Penamaan index konsisten dengan `add_performance_indexes.js` (`idx_<table>_<kolom>`). Untuk tabel `media`/`tags` prefix dipersingkat `idx_pp_*` agar aman dari batas 64 char nama index MySQL.
>
> Komentar Post **tidak memakai tabel baru** — di migration 2, `discussions` ditambah kolom `post_id` (adapter).

---

## 2. Migration 2 — adapter komentar di `discussions`

```js
/**
 * Add nullable post_id (adapter) to discussions so Production Feed comments
 * reuse the existing comment system without a new table.
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.alterTable('discussions', (table) => {
    table.integer('film_id').unsigned().nullable().alter();
    table.integer('post_id').unsigned().nullable();
    table.foreign('post_id').references('post_id').inTable('production_posts').onDelete('CASCADE');
    table.index('post_id', 'idx_discussions_post');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema.alterTable('discussions', (table) => {
    table.dropIndex('post_id', 'idx_discussions_post');
    table.dropForeign('post_id');
    table.dropColumn('post_id');
    table.integer('film_id').unsigned().notNullable().alter();
  });
};
```

Catatan:
- `post_id` nullable → komentar film existing (`film_id` terisi) tidak terpengaruh; `film_id` diubah menjadi nullable karena komentar feed tidak merujuk film.
- `ON DELETE CASCADE` → komentar Post ikut terhapus saat post di-hard delete.
- `idx_discussions_post` melayani query komentar per Post (adapter).

---

## 2. Review

### 2.1 Kesesuaian Database Standard
- ✅ `snake_case` untuk tabel & kolom; PK auto-increment (`post_id`, `media_id`, `tag_id`; komentar memakai `diskusi_id` existing).
- ✅ Timestamp: `created_at`/`updated_at` (`timestamps(true, true)` — pola `community_discussions`) atau `defaultTo(knex.fn.now())` untuk tabel tanpa `updated_at` (pola `collections`).
- ✅ Enum `table.enum(...)` (pola `learning_materials.tipe`).
- ✅ FK eksplisit dengan `onDelete` yang sesuai; aksi referensi mengikuti `films`, `carousel_items`, `categories`.
- ✅ Rollback aman: migration 1 memakai `dropTableIfExists` dengan urutan **anak → induk** (`production_post_tags` → `tags` → `production_post_media` → `production_posts`); migration 2 men-drop index, FK, lalu kolom `post_id` di `discussions`.
- ✅ Tidak mengubah schema `users`, `films`, `categories` — hanya mereferensikannya (low coupling). Satu-satunya alter tabel existing adalah `discussions` (kolom `post_id` nullable + `film_id` nullable), tanpa mengubah perilaku komentar film.

### 2.2 Poin yang diperiksa (self-review)
- [x] Urutan pembuatan tabel: induk (`production_posts`, `tags`) dibuat **sebelum** tabel anak yang memilikinya → FK tidak pernah merefer tabel yang belum ada.
- [x] Urutan rollback: tabel anak di-drop sebelum induk → tidak ada FK yang merefer tabel yang sudah di-drop.
- [x] `film_id` & `category_id` nullable + `SET NULL` → post bertahan saat film/kategori dihapus.
- [x] Media & komentar `CASCADE` → tidak ada baris yatim saat post di-hard delete (komentar via `discussions.post_id`).
- [x] `discussions.post_id` nullable → komentar film existing (`film_id`) tidak terpengaruh; `idx_discussions_post` melayani query komentar per Post.
- [x] `slug` UNIQUE nullable → aman untuk draft & mengikuti pola `generateSlug(judul, post_id)` saat publish.
- [x] Index untuk semua jalur query utama feed: listing `(status, visibility, published_at)`, author `(user_id, published_at)`, filter `film_id`/`category_id`, galeri `(post_id, sort_order)`.
- [x] Komposit `(post_id, sort_order)` & `(user_id, published_at)` mencakup kolom FK sebagai leftmost prefix → FK MySQL memakai index yang sudah ada, tanpa index duplikat.
- [x] Syntax terverifikasi: `node --check` → `SYNTAX OK`.

### 2.3 Catatan & keputusan
- **Soft delete baru untuk project** (`deleted_at`) di-scope hanya ke context feed; module lain tidak tersentuh.
- **Reuse** tabel `categories` yang sudah ada; tidak membuat tabel kategori duplikat.
- **Komentar tanpa tabel baru**: migration 2 menambah `discussions.post_id` (adapter) alih-alih `production_post_comments` — satu sistem komentar, moderasi terpusat.
- `table.timestamps(true, true)` menghasilkan `created_at`/`updated_at` `NOT NULL DEFAULT CURRENT_TIMESTAMP` — sama seperti tabel komunitas existing.

---

## 3. Testing Checklist

### 3.1 Unit / Syntax
- [ ] Jalankan `node --check backend/src/database/migrations/20260806000000_create_production_feed_tables.js` (✔ sudah OK).
- [ ] Jalankan `node --check backend/src/database/migrations/20260807000000_add_post_id_to_discussions.js` (✔ sudah OK).

### 3.2 Migration (via Knex, folder `backend/`)
- [x] `npm run migrate` — sukses tanpa error, 4 tabel feed terbuat + `discussions.post_id` terpasang.
- [ ] `npm run migrate:rollback` — sukses, semua tabel ter-drop, `discussions.post_id` terlepas, `knex_migrations` bersih.
- [ ] Ulangi `migrate` → `rollback` (idempotent round-trip, aman di-run berulang).

### 3.3 Verifikasi struktur (query langsung MySQL)
- [x] `SHOW TABLES` memuat: `production_posts`, `production_post_media`, `tags`, `production_post_tags` (dan `discussions` existing).
- [x] `SHOW CREATE TABLE production_posts` — FK `user_id` CASCADE, `film_id`/`category_id` SET NULL, UNIQUE `slug`, index `idx_production_posts_feed`, `idx_production_posts_user_published`, `idx_production_posts_film`, `idx_production_posts_category`, `idx_production_posts_pin`.
- [x] `SHOW CREATE TABLE production_post_media` — FK `post_id` CASCADE, index `(post_id, sort_order)`.
- [x] `SHOW CREATE TABLE tags` — UNIQUE `nama_tag` & `slug`.
- [x] `SHOW CREATE TABLE production_post_tags` — PK komposit `(post_id, tag_id)`, index `tag_id`, kedua FK CASCADE.
- [x] `SHOW CREATE TABLE discussions` — kolom `post_id` NULL + FK `discussions_post_id_foreign` CASCADE + index `idx_discussions_post`; `film_id` nullable; komentar film existing utuh.

### 3.4 Behavior
- [ ] Insert post dengan `film_id` dan `category_id` `NULL` — berhasil (opsional Film & Category).
- [ ] Insert post dengan `slug` `NULL` — berhasil (draft belum punya slug).
- [ ] Insert 2 baris dengan `slug` sama — ditolak UNIQUE.
- [ ] Hapus film yang direfer `production_posts.film_id` → kolom menjadi `NULL` (SET NULL).
- [ ] Hapus kategori yang direfer → `category_id` menjadi `NULL` (SET NULL).
- [ ] Hapus post (hard delete) → baris `production_post_media`, `production_post_tags`, dan `discussions.post_id` ikut terhapus (CASCADE).
- [ ] Komentar film existing tetap berfungsi (insert/read `discussions` dengan `film_id`, `post_id=NULL`).
- [ ] `production_posts` terisi `created_at`/`updated_at` otomatis; post draft `status='draft'`, `published_at=NULL`, `deleted_at=NULL`.

---

## 4. Checklist Self-Review

- [x] Hanya migration — tidak ada controller / service / route.
- [x] Sesuai Database Standard (naming, enum, FK, timestamp, index).
- [x] Rollback aman (urutan drop terbalik + `dropTableIfExists` / drop index-FK-kolom).
- [x] Reusability: reuse `categories`, refer FK `users`/`films` tanpa alter schema mereka.
- [x] Komentar Post via adapter `discussions.post_id` (nullable, tanpa tabel baru) — komentar film existing utuh.
- [x] Sesuai rancangan `docs/feed/DATABASE_PRODUCTION_FEED.md`.
- [x] Syntax tervalidasi (`node --check`).
