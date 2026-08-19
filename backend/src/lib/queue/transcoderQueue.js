/**
 * backend/src/lib/queue/transcoderQueue.js
 *
 * BullMQ Queue Producer for video transcoding jobs.
 * Enqueues jobs to Redis if available, with graceful fallback (returns false) if Redis is down.
 */

import { Queue } from 'bullmq';
import Redis from 'ioredis';
import path from 'path';

export const QUEUE_NAME = 'video-transcoding';
export const JOB_NAME = 'transcode-hls-job';

let queueInstance = null;
let redisConnection = null;

/**
 * Get or create the BullMQ Queue instance
 * @returns {Queue|null}
 */
export function getQueueInstance() {
  if (queueInstance) return queueInstance;

  const redisHost = process.env.REDIS_HOST || '127.0.0.1';
  const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
  const redisPassword = process.env.REDIS_PASSWORD || undefined;

  try {
    redisConnection = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword,
      maxRetriesPerRequest: null,
      connectTimeout: 500,
      enableOfflineQueue: false,
      retryStrategy: () => null, // Do not retry if Redis connection refused
    });

    redisConnection.on('error', (err) => {
      // Suppress unhandled redis connection errors in fallback mode
    });

    queueInstance = new Queue(QUEUE_NAME, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 10000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
      },
    });

    queueInstance.on('error', (err) => {
      // Suppress unhandled queue errors in fallback mode
    });

    return queueInstance;
  } catch (err) {
    console.warn('[TranscoderQueue] Failed to initialize Queue:', err.message);
    queueInstance = null;
    return null;
  }
}

/**
 * Validates payload parameters
 * @param {object} payload
 * @returns {boolean}
 */
export function validateTranscodePayload({ filmId, sourcePath }) {
  if (!filmId || typeof filmId !== 'number' || filmId <= 0) {
    return false;
  }

  if (!sourcePath || typeof sourcePath !== 'string' || !sourcePath.trim()) {
    return false;
  }

  // Prevent path traversal
  if (sourcePath.includes('..')) {
    return false;
  }

  const normalized = path.normalize(sourcePath).replace(/\\/g, '/');
  if (normalized.includes('..')) {
    return false;
  }

  return true;
}

/**
 * Enqueues a video transcoding job into Redis BullMQ.
 * 
 * @param {object} params
 * @param {number} params.filmId - MySQL Film ID
 * @param {string} params.sourcePath - Relative or absolute path to video file
 * @returns {Promise<boolean>} Resolves to true if successfully enqueued, false otherwise
 */
export async function enqueueVideoTranscoding({ filmId, sourcePath }) {
  const numericFilmId = Number(filmId);
  const rawSourcePath = String(sourcePath || '').trim();

  if (!validateTranscodePayload({ filmId: numericFilmId, sourcePath: rawSourcePath })) {
    console.warn(`[TranscoderQueue] Invalid payload rejected: filmId=${filmId}, sourcePath=${sourcePath}`);
    return false;
  }

  try {
    const queue = getQueueInstance();
    if (!queue) {
      console.warn('[TranscoderQueue] Redis Queue instance unavailable. Skipping enqueue.');
      return false;
    }

    const jobId = `transcode-film-${numericFilmId}`;
    const payload = {
      filmId: numericFilmId,
      sourcePath: rawSourcePath,
    };

    // Fast-fail timeout wrapper for Redis operation
    const enqueuePromise = queue.add(JOB_NAME, payload, { jobId });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Redis connection timeout')), 800)
    );

    await Promise.race([enqueuePromise, timeoutPromise]);
    console.log(`[TranscoderQueue] ✅ Job ${jobId} successfully enqueued for film ${numericFilmId}`);
    return true;
  } catch (err) {
    console.warn(`[TranscoderQueue] ⚠️ Failed to enqueue job for film ${numericFilmId}: ${err.message}`);
    return false;
  }
}

/**
 * Close queue connection (useful for graceful shutdown or tests)
 */
export async function closeQueue() {
  if (queueInstance) {
    try {
      await queueInstance.close();
    } catch {}
    queueInstance = null;
  }
  if (redisConnection) {
    try {
      redisConnection.disconnect();
    } catch {}
    redisConnection = null;
  }
}
