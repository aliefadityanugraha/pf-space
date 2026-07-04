/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.alterTable('films', (table) => {
    table.string('slug', 255).unique().after('judul');
  });

  // Generate slugs for existing films
  const films = await knex('films').select('film_id', 'judul');
  for (const film of films) {
    const slug = generateSlug(film.judul, film.film_id);
    await knex('films').where('film_id', film.film_id).update({ slug });
  }
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.alterTable('films', (table) => {
    table.dropColumn('slug');
  });
}

function generateSlug(title, id) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  return `${base}-${id}`;
}
