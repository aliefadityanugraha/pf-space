import knex from 'knex';
import knexConfig from '../knexfile.js';
import path from 'path';

const env = process.env.NODE_ENV || 'development';
const db = knex(knexConfig[env] || knexConfig.development);

const DRY_RUN = process.argv.includes('--dry-run');

const FILM_FILE_FIELDS = [
  'link_video_utama',
  'link_trailer',
  'link_bts',
  'gambar_poster',
  'banner_url',
  'file_naskah',
  'file_storyboard',
  'file_rab',
];

const VIDEO_EXTS = new Set(['.mp4', '.webm', '.ogg', '.mov', '.m4v']);
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif']);
const DOC_EXTS = new Set(['.pdf']);

function guessSubfolder(filename, fieldName) {
  const ext = (path.extname(filename) || '').toLowerCase();

  if (VIDEO_EXTS.has(ext)) return 'videos';
  if (IMAGE_EXTS.has(ext)) return 'images';
  if (DOC_EXTS.has(ext)) return 'documents';

  // Fallback by field name semantics
  if (['gambar_poster', 'banner_url'].includes(fieldName)) return 'images';
  if (['file_naskah', 'file_storyboard', 'file_rab'].includes(fieldName)) return 'documents';
  if (['link_video_utama', 'link_trailer', 'link_bts'].includes(fieldName)) return 'videos';

  // Default
  return 'documents';
}

function fixOnePath(value, fieldName) {
  if (!value || typeof value !== 'string') return null;
  if (!value.startsWith('/uploads/')) return null;

  const rest = value.substring('/uploads/'.length);
  // Already has subfolder
  if (rest.includes('/')) return null;

  const id = rest;
  const subfolder = guessSubfolder(id, fieldName);
  return `/uploads/${subfolder}/${id}`;
}

async function fixFilms() {
  const columns = ['film_id', ...FILM_FILE_FIELDS];
  const rows = await db('films').select(columns);

  let affected = 0;
  for (const row of rows) {
    const updates = {};
    for (const field of FILM_FILE_FIELDS) {
      const current = row[field];
      const fixed = fixOnePath(current, field);
      if (fixed && fixed !== current) {
        updates[field] = fixed;
      }
    }
    if (Object.keys(updates).length > 0) {
      affected++;
      if (DRY_RUN) {
        console.log(`[DRY] Film ${row.film_id} updates:`, updates);
      } else {
        await db('films').where('film_id', row.film_id).update(updates);
        console.log(`Updated film ${row.film_id}:`, updates);
      }
    }
  }
  return affected;
}

async function fixLearningMaterials() {
  // Only file_path needs fixing (PDFs)
  const rows = await db('learning_materials').select(['materi_id', 'tipe', 'file_path']);

  let affected = 0;
  for (const row of rows) {
    const field = 'file_path';
    const current = row[field];
    let fixed = null;

    // Prefer documents for PDFs, else guess by extension
    if (current && typeof current === 'string' && current.startsWith('/uploads/')) {
      const rest = current.substring('/uploads/'.length);
      if (!rest.includes('/')) {
        const ext = (path.extname(rest) || '').toLowerCase();
        const subfolder = row.tipe === 'pdf' || ext === '.pdf' ? 'documents' : guessSubfolder(rest, field);
        fixed = `/uploads/${subfolder}/${rest}`;
      }
    }

    if (fixed && fixed !== current) {
      affected++;
      if (DRY_RUN) {
        console.log(`[DRY] Material ${row.materi_id} updates:`, { file_path: fixed });
      } else {
        await db('learning_materials').where('materi_id', row.materi_id).update({ file_path: fixed });
        console.log(`Updated material ${row.materi_id}:`, { file_path: fixed });
      }
    }
  }
  return affected;
}

async function main() {
  console.log(`Starting upload path fixer (${DRY_RUN ? 'dry-run' : 'execute'})`);
  try {
    const films = await fixFilms();
    const materials = await fixLearningMaterials();
    console.log(`Done. Films affected: ${films}, Learning materials affected: ${materials}`);
  } catch (err) {
    console.error('Error running fixer:', err);
  } finally {
    await db.destroy();
  }
}

main();
