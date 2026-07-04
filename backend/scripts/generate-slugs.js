import knex from 'knex';
import knexConfig from '../knexfile.js';

const db = knex(knexConfig.development);

function generateSlug(title, id) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  return `${slug}-${id}`;
}

async function main() {
  try {
    // Get all films without slug
    const films = await db('films').whereNull('slug').orWhere('slug', '');
    
    console.log(`Found ${films.length} films without slug`);
    
    for (const film of films) {
      const slug = generateSlug(film.judul, film.film_id);
      await db('films').where('film_id', film.film_id).update({ slug });
      console.log(`Updated film ${film.film_id}: ${film.judul} -> ${slug}`);
    }
    
    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await db.destroy();
  }
}

main();
