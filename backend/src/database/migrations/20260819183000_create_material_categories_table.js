/**
 * Migration: Create material_categories table and link to learning_materials
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  const hasTable = await knex.schema.hasTable('material_categories');
  if (!hasTable) {
    await knex.schema.createTable('material_categories', (table) => {
      table.increments('category_id').primary();
      table.string('nama_kategori', 100).notNullable().unique();
      table.string('slug', 100).notNullable().unique();
      table.text('deskripsi').nullable();
      table.string('icon', 50).nullable();
      table.integer('urutan').defaultTo(0);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });

    // Insert initial default material categories
    const initialCategories = [
      {
        nama_kategori: 'Dasar Perfilman',
        slug: 'dasar-perfilman',
        deskripsi: 'Materi dasar teori perfilman, sejarah sinema, dan pengenalan industri.',
        icon: 'BookOpen',
        urutan: 1
      },
      {
        nama_kategori: 'Pra Produksi',
        slug: 'pra-produksi',
        deskripsi: 'Panduan penulisan skenario, bedah naskah, pencarian lokasi, dan pembentukan tim.',
        icon: 'FileText',
        urutan: 2
      },
      {
        nama_kategori: 'Produksi',
        slug: 'produksi',
        deskripsi: 'Teknik penyutradaraan, tata kamera, pencahayaan, dan perekaman suara di set.',
        icon: 'Video',
        urutan: 3
      },
      {
        nama_kategori: 'Pasca Produksi',
        slug: 'pasca-produksi',
        deskripsi: 'Teknik penyuntingan gambar, tata suara/mixing, color grading, dan pengolahan efek.',
        icon: 'Film',
        urutan: 4
      },
      {
        nama_kategori: 'Apresiasi & Kritik',
        slug: 'apresiasi-kritik',
        deskripsi: 'Analisis karya film, studi kasus sinematografi, dan ulasan apresiasi sinema.',
        icon: 'Star',
        urutan: 5
      },
      {
        nama_kategori: 'Sistem Informasi',
        slug: 'sistem-informasi',
        deskripsi: 'Panduan penggunaan platform PF Space dan manajerial arsip digital.',
        icon: 'MonitorPlay',
        urutan: 6
      }
    ];

    await knex('material_categories').insert(initialCategories);
  }

  // Add material_category_id foreign key to learning_materials if not exists
  const hasColumn = await knex.schema.hasColumn('learning_materials', 'material_category_id');
  if (!hasColumn) {
    await knex.schema.table('learning_materials', (table) => {
      table.integer('material_category_id').unsigned().nullable();
      table.foreign('material_category_id').references('category_id').inTable('material_categories').onDelete('SET NULL');
    });

    // Populate material_category_id based on legacy string kategori
    const cats = await knex('material_categories').select('category_id', 'nama_kategori');
    for (const cat of cats) {
      await knex('learning_materials')
        .where('kategori', cat.nama_kategori)
        .update({ material_category_id: cat.category_id });
    }
  }
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  const hasColumn = await knex.schema.hasColumn('learning_materials', 'material_category_id');
  if (hasColumn) {
    await knex.schema.table('learning_materials', (table) => {
      table.dropForeign(['material_category_id']);
      table.dropColumn('material_category_id');
    });
  }
  await knex.schema.dropTableIfExists('material_categories');
}
