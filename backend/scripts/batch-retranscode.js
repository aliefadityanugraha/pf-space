/**
 * backend/scripts/batch-retranscode.js
 *
 * CLI Utility script to batch enqueue all past uploaded MP4 videos into Redis BullMQ for HLS transcoding.
 * Usage:
 *   node scripts/batch-retranscode.js          (Transcode videos with status 'none', 'failed', or null)
 *   node scripts/batch-retranscode.js --all    (Force re-transcode ALL videos in database)
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import knex from 'knex';
import { Model } from 'objection';
import { Film } from '../src/models/Film.js';
import { filmService } from '../src/services/film.service.js';
import { closeQueue } from '../src/lib/queue/transcoderQueue.js';

const dbConfig = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pf_space',
  },
};

const db = knex(dbConfig);
Model.knex(db);

async function runBatch() {
  console.log('🚀 Starting Batch Transcode CLI Tool...');
  const args = process.argv.slice(2);
  const forceAll = args.includes('--all');

  try {
    let query = Film.query().whereNotNull('link_video_utama').where('link_video_utama', '!=', '');
    if (!forceAll) {
      query = query.where((builder) => {
        builder.whereNull('transcode_status')
          .orWhere('transcode_status', 'none')
          .orWhere('transcode_status', 'failed');
      });
    }

    const films = await query;
    console.log(`📋 Found ${films.length} film(s) eligible for transcoding.`);

    if (films.length === 0) {
      console.log('✅ No pending or untranscoded films found. System is up to date.');
      await db.destroy();
      await closeQueue();
      process.exit(0);
    }

    let successCount = 0;
    let failCount = 0;

    for (const film of films) {
      try {
        console.log(`⏳ Enqueuing film #${film.film_id} ("${film.judul}")...`);
        await filmService.retranscode(film.film_id);
        successCount++;
        console.log(`   ✅ Enqueued film #${film.film_id}`);
      } catch (err) {
        failCount++;
        console.error(`   ❌ Failed to enqueue film #${film.film_id}: ${err.message}`);
      }
    }

    console.log('\n=============================================');
    console.log(`🎉 Batch Transcode Process Complete!`);
    console.log(`- Total Processed: ${films.length}`);
    console.log(`- Enqueued Successfully: ${successCount}`);
    console.log(`- Failed: ${failCount}`);
    console.log('=============================================\n');
  } catch (err) {
    console.error('💥 Batch transcode fatal error:', err);
  } finally {
    await db.destroy();
    await closeQueue();
    process.exit(0);
  }
}

runBatch();
