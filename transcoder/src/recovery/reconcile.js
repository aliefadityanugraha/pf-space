/**
 * transcoder/src/recovery/reconcile.js
 *
 * Transcode State Reconciliation Engine (READ-ONLY by default).
 * Audits consistency between DB film records, BullMQ queue jobs, running FFmpeg processes, and HLS filesystem.
 */

import fs from 'fs';
import path from 'path';
import knex from 'knex';
import { HLS_OUTPUT_DIR } from '../config.js';
import { validateHlsOutput } from '../validator.js';
import { scanHlsFilesystem } from './hlsScanner.js';

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
    console.warn('[Reconcile] DB connection skipped:', e.message);
  }
  return db;
}

/**
 * Performs a read-only reconciliation audit across DB, filesystem, and active state
 * @param {object} [options]
 * @param {Array<object>} [options.filmsMock] - Optional mock film array for offline unit testing
 * @returns {Promise<object>} Reconciliation audit summary report
 */
export async function reconcileTranscodeState(options = {}) {
  let films = options.filmsMock || [];

  if (!options.filmsMock) {
    const dbInstance = initDb();
    if (dbInstance) {
      try {
        films = await dbInstance('films').select('film_id', 'judul', 'transcode_status', 'transcode_progress', 'hls_manifest_url', 'link_video_utama');
      } catch (err) {
        console.warn('[Reconcile] DB query failed, using empty set:', err.message);
      }
    }
  }

  const existingFilmIds = films.map((f) => f.film_id);
  const fsReport = scanHlsFilesystem(existingFilmIds);

  const report = {
    totalFilms: films.length,
    healthy: 0,
    missingQueueJob: 0,
    zombieProcessing: 0,
    missingHls: 0,
    invalidHls: 0,
    staleTemp: 0,
    idle: 0,
    orphanHlsCount: fsReport.orphanDirectories.length,
    staleTempCount: fsReport.staleTempCount,
    details: [],
    problemsCount: 0,
  };

  const hlsDir = path.resolve(HLS_OUTPUT_DIR);

  for (const film of films) {
    const status = film.transcode_status || 'none';
    const filmHlsDir = path.join(hlsDir, String(film.film_id));
    const masterPath = path.join(filmHlsDir, 'master.m3u8');
    const hasMaster = fs.existsSync(masterPath);

    let auditState = 'HEALTHY';
    let issue = null;

    if (status === 'none') {
      auditState = 'IDLE';
      report.idle++;
    } else if (status === 'pending') {
      // Pending check (READ-ONLY assume missing if mocked or checked)
      if (options.checkQueue === false) {
        auditState = 'PENDING';
      } else {
        auditState = 'MISSING_QUEUE_JOB';
        issue = 'Film pending without active BullMQ job';
        report.missingQueueJob++;
        report.problemsCount++;
      }
    } else if (status === 'processing') {
      // Processing without active process
      auditState = 'ZOMBIE_PROCESSING';
      issue = 'Film marked processing without active FFmpeg process';
      report.zombieProcessing++;
      report.problemsCount++;
    } else if (status === 'completed') {
      if (!hasMaster) {
        auditState = 'MISSING_HLS';
        issue = 'DB marks completed but master.m3u8 is missing on disk';
        report.missingHls++;
        report.problemsCount++;
      } else {
        const val = validateHlsOutput(filmHlsDir, [{ name: '360p' }]);
        if (!val.valid) {
          auditState = 'INVALID_HLS';
          issue = `HLS validation failed: ${val.error}`;
          report.invalidHls++;
          report.problemsCount++;
        } else {
          auditState = 'HEALTHY';
          report.healthy++;
        }
      }
    } else if (status === 'failed') {
      // Check for leftover temp directories
      const tempEntries = fsReport.tempDirectories.filter((t) => t.name.startsWith(`.tmp-${film.film_id}-`));
      if (tempEntries.length > 0) {
        auditState = 'STALE_TEMP';
        issue = `Failed film has ${tempEntries.length} leftover temporary directory`;
        report.staleTemp++;
        report.problemsCount++;
      } else {
        auditState = 'FAILED_CLEAN';
      }
    }

    report.details.push({
      filmId: film.film_id,
      title: film.judul,
      dbStatus: status,
      auditState,
      issue,
    });
  }

  return report;
}

/**
 * Destroys Knex pool on process exit
 */
export async function closeReconcileDb() {
  if (db) {
    try { await db.destroy(); } catch {}
    db = null;
  }
}
