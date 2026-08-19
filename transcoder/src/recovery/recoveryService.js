/**
 * transcoder/src/recovery/recoveryService.js
 *
 * Safe Recovery Service for PF Space Transcoder.
 * Executes non-destructive recovery actions based on reconciliation audit results.
 * Source MP4 files are NEVER deleted.
 */

import fs from 'fs';
import path from 'path';
import knex from 'knex';
import { HLS_OUTPUT_DIR } from '../config.js';
import { cleanupTempHlsDir } from '../paths.js';
import { reconcileTranscodeState } from './reconcile.js';

let db = null;

function initDb() {
  if (db) return db;
  const dbName = process.env.DB_NAME || 'pf_space';
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbHost = process.env.DB_HOST || '127.0.0.1';
  const dbPort = parseInt(process.env.DB_PORT || '3306', 10);

  try {
    db = knex({
      client: 'mysql2',
      connection: {
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword,
        database: dbName,
      },
    });
  } catch (e) {
    console.warn('[RecoveryService] DB connection skipped:', e.message);
  }
  return db;
}

/**
 * Executes idempotent, non-destructive recovery actions on reconciled problems
 * @param {object} [options]
 * @returns {Promise<object>} Recovery execution summary
 */
export async function executeSafeRecovery(options = {}) {
  const audit = await reconcileTranscodeState(options);
  const dbInstance = initDb();

  const results = {
    zombiesRecovered: 0,
    missingQueueJobsReenqueued: 0,
    staleTempCleaned: 0,
    missingHlsMarkedFailed: 0,
    skippedOrphans: audit.orphanHlsCount,
    sourceMp4sPreserved: 0,
  };

  const hlsDir = path.resolve(HLS_OUTPUT_DIR);

  for (const item of audit.details) {
    const { filmId, auditState } = item;

    if (auditState === 'ZOMBIE_PROCESSING') {
      if (dbInstance && !options.readOnly) {
        await dbInstance('films').where('film_id', filmId).update({
          transcode_status: 'failed',
          transcode_progress: 0,
        });
      }
      results.zombiesRecovered++;
    } else if (auditState === 'MISSING_QUEUE_JOB') {
      if (dbInstance && !options.readOnly) {
        await dbInstance('films').where('film_id', filmId).update({
          transcode_status: 'pending',
          transcode_progress: 0,
        });
      }
      results.missingQueueJobsReenqueued++;
    } else if (auditState === 'MISSING_HLS' || auditState === 'INVALID_HLS') {
      if (dbInstance && !options.readOnly) {
        await dbInstance('films').where('film_id', filmId).update({
          transcode_status: 'failed',
          transcode_progress: 0,
          hls_manifest_url: null,
        });
      }
      results.missingHlsMarkedFailed++;
      results.sourceMp4sPreserved++;
    } else if (auditState === 'STALE_TEMP') {
      if (fs.existsSync(hlsDir) && !options.readOnly) {
        const entries = fs.readdirSync(hlsDir);
        for (const e of entries) {
          if (e.startsWith(`.tmp-${filmId}-`)) {
            cleanupTempHlsDir(path.join(hlsDir, e));
            results.staleTempCleaned++;
          }
        }
      }
    }
  }

  return results;
}

export async function closeRecoveryDb() {
  if (db) {
    try { await db.destroy(); } catch {}
    db = null;
  }
}
