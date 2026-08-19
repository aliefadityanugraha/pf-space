/**
 * transcoder/src/worker.js
 *
 * Real HLS Transcoder Worker Process.
 * Consumes jobs from Redis BullMQ queue 'video-transcoding', inspects video metadata,
 * executes multi-rendition HLS transcoding, validates output, and updates MySQL status.
 * Hardened with monotonic progress tracking, PID tracking, zombie job recovery, and observability.
 */

import { Worker } from 'bullmq';
import knex from 'knex';
import path from 'path';
import fs from 'fs';
import os from 'os';
import {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
  QUEUE_NAME,
  CONCURRENCY,
  HLS_OUTPUT_DIR,
  MIN_FREE_RAM_MB,
} from './config.js';
import {
  resolveAndValidateSourcePath,
  getHlsOutputDir,
  getTempHlsOutputDir,
  cleanupTempHlsDir,
  promoteTempToFinalHlsDir,
  cleanStaleTempDirectories,
} from './paths.js';
import { inspectVideoMetadata } from './ffprobe.js';
import { selectRenditions } from './renditions.js';
import { transcodeRendition, cancelAllFfmpegProcesses } from './ffmpeg.js';
import { generateMasterPlaylist } from './masterPlaylist.js';
import { validateHlsOutput } from './validator.js';
import { checkRuntime } from './runtime/checkRuntime.js';

let db = null;

/**
 * Initialize Knex database connection if env vars exist
 */
function initDb() {
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
    console.warn('[Database] DB init skipped:', e.message);
  }
}

initDb();

/**
 * Track progress per film in memory to enforce strictly monotonic progress updates
 */
const filmProgressMap = new Map();

/**
 * Updates film transcoding status in database safely with monotonic progress guarantee
 * @param {number} filmId
 * @param {object} patchData
 */
export async function updateFilmStatus(filmId, patchData) {
  if (!db) return;
  try {
    const patch = { ...patchData };

    if (typeof patch.transcode_progress === 'number') {
      const currentProg = filmProgressMap.get(filmId) || 0;
      // Monotonic guarantee: progress can only stay same or increase
      const monotonicProg = Math.max(currentProg, patch.transcode_progress);
      filmProgressMap.set(filmId, monotonicProg);
      patch.transcode_progress = monotonicProg;
    }

    if (patch.transcode_status === 'completed' || patch.transcode_status === 'failed' || patch.transcode_status === 'none') {
      filmProgressMap.delete(filmId);
    }

    await db('films').where('film_id', filmId).update(patch);
    console.log(`[Database] film=${filmId} updated -> ${JSON.stringify(patch)}`);
  } catch (err) {
    console.warn(`[Database] DB update failed for film ${filmId}:`, err.message);
  }
}

/**
 * Recovers zombie jobs stranded in 'processing' status on worker startup
 */
export async function recoverZombieJobs() {
  // First, terminate any orphan FFmpeg processes from previous session
  cancelAllFfmpegProcesses();

  if (!db) return;
  try {
    const strandedFilms = await db('films').where('transcode_status', 'processing');
    if (Array.isArray(strandedFilms) && strandedFilms.length > 0) {
      for (const film of strandedFilms) {
        console.warn(`[Worker] [Recovery] Found zombie stranded film=${film.film_id} in 'processing' state. Resetting to 'failed'...`);
        await updateFilmStatus(film.film_id, { transcode_status: 'failed', transcode_progress: 0 });

        // Clean any temp directories matching filmId
        const hlsDir = path.resolve(HLS_OUTPUT_DIR);
        if (fs.existsSync(hlsDir)) {
          const entries = fs.readdirSync(hlsDir);
          for (const e of entries) {
            if (e.startsWith(`.tmp-${film.film_id}-`)) {
              cleanupTempHlsDir(path.join(hlsDir, e));
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn(`[Worker] [Recovery] Zombie job recovery check failed:`, err.message);
  }
}

/**
 * Main job processor function
 * @param {import('bullmq').Job} job
 */
export async function processTranscodeJob(job) {
  const { filmId, sourcePath } = job.data || {};
  const startTime = Date.now();
  console.log(`[Transcoder] film=${filmId} status=processing (jobId=${job.id})`);

  // Resource Guard: Check available RAM before starting
  const freeRamMb = Math.floor(os.freemem() / (1024 * 1024));
  if (freeRamMb < MIN_FREE_RAM_MB) {
    console.warn(`[Worker] [ResourceGuard] Low RAM (${freeRamMb}MB < ${MIN_FREE_RAM_MB}MB threshold). Applying back-pressure delay...`);
    await new Promise((r) => setTimeout(r, 2000));
  }

  // 1. Validate Payload
  if (!filmId || typeof filmId !== 'number' || filmId <= 0) {
    throw new Error(`Invalid job payload: filmId must be a positive number (got: ${filmId})`);
  }

  // Reset in-memory progress for this film
  filmProgressMap.set(filmId, 0);

  // 2. Validate Source Path & Filesystem Boundary
  const validation = resolveAndValidateSourcePath(sourcePath);
  if (!validation.valid) {
    await updateFilmStatus(filmId, { transcode_status: 'failed', transcode_progress: 0 });
    throw new Error(`Source path validation failed: ${validation.error}`);
  }

  const sourceAbsolutePath = validation.absolutePath;
  const tempDir = getTempHlsOutputDir(filmId, job.id);
  const finalDir = getHlsOutputDir(filmId);

  console.log(`[Transcoder] film=${filmId} source_validated=${sourceAbsolutePath}`);

  // 3. Update DB State: processing (0%)
  await updateFilmStatus(filmId, {
    transcode_status: 'processing',
    transcode_progress: 0,
  });

  try {
    // 4. FFprobe Metadata Inspection
    const metadata = await inspectVideoMetadata(sourceAbsolutePath);
    console.log(`[FFprobe] film=${filmId} resolution=${metadata.width}x${metadata.height} duration=${metadata.duration.toFixed(1)}s audio=${metadata.hasAudioStream}`);

    // 5. Rendition Selection Strategy
    const renditions = selectRenditions(metadata.width, metadata.height);
    console.log(`[Transcoder] film=${filmId} selected_renditions=${renditions.map((r) => r.name).join(',')}`);

    // 6. Multi-Rendition FFmpeg Encoding into Temporary Output Directory (0..95%)
    const totalRenditions = renditions.length;
    for (let i = 0; i < totalRenditions; i++) {
      const r = renditions[i];
      const renditionTempDir = path.join(tempDir, r.name);
      const startPercent = Math.floor((i / totalRenditions) * 90);
      const percentRange = Math.floor(90 / totalRenditions);

      console.log(`[FFmpeg] film=${filmId} rendition=${r.name} started (${i + 1}/${totalRenditions})`);

      await transcodeRendition({
        filmId,
        inputPath: sourceAbsolutePath,
        outputDir: renditionTempDir,
        rendition: r,
        totalDuration: metadata.duration,
        hasAudioStream: metadata.hasAudioStream,
        onProgress: async (renditionPercent) => {
          const overallProgress = Math.min(95, startPercent + Math.floor((renditionPercent / 100) * percentRange));
          console.log(`[FFmpeg] film=${filmId} rendition=${r.name} progress=${overallProgress}%`);
          await updateFilmStatus(filmId, { transcode_progress: overallProgress });
        },
      });

      console.log(`[FFmpeg] film=${filmId} rendition=${r.name} completed`);
    }

    // 7. Master Playlist Generation
    console.log(`[HLS] film=${filmId} master_playlist_generation=started`);
    generateMasterPlaylist(tempDir, renditions);

    // 8. Output Validation (95%)
    await updateFilmStatus(filmId, { transcode_progress: 95 });
    console.log(`[HLS] film=${filmId} validation=started (95%)`);
    const validationResult = validateHlsOutput(tempDir, renditions);
    if (!validationResult.valid) {
      throw new Error(`HLS output validation failed: ${validationResult.error}`);
    }
    console.log(`[HLS] film=${filmId} validation=passed`);

    // 9. Atomic Directory Promotion (.tmp -> final hls dir) (99%)
    await updateFilmStatus(filmId, { transcode_progress: 99 });
    console.log(`[HLS] film=${filmId} promotion=started (99%)`);
    promoteTempToFinalHlsDir(tempDir, finalDir);
    console.log(`[HLS] film=${filmId} promotion=completed`);

    // 10. Update DB State: completed (100%) & manifest URL
    const relativeManifestUrl = `/uploads/videos/hls/${filmId}/master.m3u8`;
    await updateFilmStatus(filmId, {
      transcode_status: 'completed',
      transcode_progress: 100,
      hls_manifest_url: relativeManifestUrl,
    });

    console.log(`[Transcoder] ✅ film=${filmId} status=completed manifest=${relativeManifestUrl}`);

    return {
      filmId,
      status: 'completed',
      hlsManifestUrl: relativeManifestUrl,
      renditions: renditions.map((r) => r.name),
    };
  } catch (err) {
    console.error(`[Transcoder] ❌ film=${filmId} status=failed reason=${err.message}`);

    // Failure Cleanup: Remove temporary directory if exists
    cleanupTempHlsDir(tempDir);

    // Mark DB status as failed
    await updateFilmStatus(filmId, {
      transcode_status: 'failed',
    });

    throw err;
  }
}

let workerInstance = null;

export async function startWorker() {
  console.log(`[Worker] Performing startup runtime health check...`);
  try {
    const report = await checkRuntime();
    console.log(`[Worker] Runtime Health Check Status: ${report.status}`);
    if (report.blockers.length > 0) {
      console.warn(`[Worker] ⚠️ Runtime blockers active:`, report.blockers.join('; '));
    }
  } catch (e) {
    console.warn(`[Worker] Runtime check failed:`, e.message);
  }

  // Scan and clean stale temporary output directories (> 1 hour old) on startup
  try {
    const cleanedCount = cleanStaleTempDirectories(3600000);
    if (cleanedCount > 0) {
      console.log(`[Cleanup] Cleaned ${cleanedCount} stale temporary output directories on startup.`);
    }
  } catch (e) {
    console.warn(`[Cleanup] Stale directory cleanup skipped:`, e.message);
  }

  // Recover zombie jobs stranded in 'processing' status
  try {
    await recoverZombieJobs();
  } catch (e) {
    console.warn(`[Worker] Zombie recovery skipped:`, e.message);
  }

  console.log(`[Queue] Connecting to Redis at ${REDIS_HOST}:${REDIS_PORT}, Queue: '${QUEUE_NAME}'...`);

  workerInstance = new Worker(
    QUEUE_NAME,
    processTranscodeJob,
    {
      connection: {
        host: REDIS_HOST,
        port: REDIS_PORT,
        password: REDIS_PASSWORD,
        maxRetriesPerRequest: null,
      },
      concurrency: CONCURRENCY,
    }
  );

  workerInstance.on('completed', (job) => {
    console.log(`[Queue] Job ${job.id} marked COMPLETED`);
  });

  workerInstance.on('failed', (job, err) => {
    console.error(`[Queue] Job ${job?.id} FAILED (attempt ${job?.attemptsMade}/${job?.opts?.attempts || 1}):`, err.message);
    if (job?.attemptsMade < (job?.opts?.attempts || 1)) {
      console.log(`[Retry] film=${job.data?.filmId} retrying attempt ${job.attemptsMade + 1}...`);
    }
  });

  workerInstance.on('stalled', (jobId) => {
    console.warn(`[Queue] Job ${jobId} STALLED. Worker will recover or retry.`);
  });

  workerInstance.on('error', (err) => {
    console.warn(`[Queue] Queue error:`, err.message);
  });

  console.log(`[Worker] 🟢 Transcoder Worker Process Started (Concurrency: ${CONCURRENCY})`);
  return workerInstance;
}

// Graceful Shutdown
async function shutdown(signal) {
  console.log(`[Worker] Received ${signal}. Shutting down worker gracefully...`);
  cancelAllFfmpegProcesses();
  if (workerInstance) {
    await workerInstance.close();
  }
  if (db) {
    await db.destroy();
  }
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Auto-start if run directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('worker.js')) {
  startWorker();
}
