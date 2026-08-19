/**
 * transcoder/src/observability/logger.js
 *
 * Standardized Observability Logger for Transcoder Operations.
 * Emits structured event logs with context: category, filmId, jobId, event, status, and message.
 */

export function logTranscodeEvent(category, { filmId, jobId, event, status, progress, message, extra }) {
  const timestamp = new Date().toISOString();
  const tag = `[${category}]`;
  const context = [
    filmId ? `filmId=${filmId}` : null,
    jobId ? `jobId=${jobId}` : null,
    event ? `event=${event}` : null,
    status ? `status=${status}` : null,
    typeof progress === 'number' ? `progress=${progress}%` : null,
    message ? `message="${message}"` : null,
    extra ? `details=${JSON.stringify(extra)}` : null,
  ]
    .filter(Boolean)
    .join(' ');

  console.log(`${tag} ${timestamp} | ${context}`);
}
