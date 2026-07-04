/**
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  await knex.schema.createTable('settings', (table) => {
    table.increments('id').primary();
    table.string('key').unique().notNullable();
    table.json('value').nullable();
    table.text('description').nullable();
    table.boolean('is_public').defaultTo(false);
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // Seed initial announcement setting
  await knex('settings').insert({
    key: 'announcement_modal',
    value: JSON.stringify({
      is_active: false,
      title: 'Selamat Datang di PF Space',
      content: 'Temukan berbagai karya film siswa dan materi pembelajaran menarik di sini.',
      button_text: 'Mulai Jelajah',
      button_url: '/archive',
      type: 'modal'
    }),
    description: 'Konfigurasi modal pengumuman di halaman utama',
    is_public: true
  });
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('settings');
}
