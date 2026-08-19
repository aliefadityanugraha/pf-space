/**
 * backend/src/services/transcodeAudit.service.js
 *
 * Transcode Audit & Governance Service.
 * Manages persistent audit trail records in transcode_operations database table.
 * Fail-safe: Audit logging failures are caught cleanly to prevent interrupting job execution.
 */

import { TranscodeOperation } from '../models/TranscodeOperation.js';

export class TranscodeAuditService {
  /**
   * Records a transcoding lifecycle operation into database
   * @param {object} params
   * @returns {Promise<TranscodeOperation|null>}
   */
  async recordOperation({
    film_id,
    job_id = null,
    operation_type,
    previous_status = null,
    new_status = null,
    progress = 0,
    attempt = 1,
    reason = null,
    error_code = null,
    error_message = null,
    metadata_json = null,
  }) {
    try {
      if (!film_id || !operation_type) return null;

      const record = await TranscodeOperation.query().insert({
        film_id: parseInt(film_id, 10),
        job_id: job_id ? String(job_id) : null,
        operation_type,
        previous_status,
        new_status,
        progress: typeof progress === 'number' ? progress : 0,
        attempt: typeof attempt === 'number' ? attempt : 1,
        reason,
        error_code,
        error_message: error_message ? String(error_message).slice(0, 1000) : null,
        metadata_json: typeof metadata_json === 'object' ? JSON.stringify(metadata_json) : metadata_json,
      });

      return record;
    } catch (err) {
      console.warn(`[AuditService] Failed to record operation (filmId=${film_id}, type=${operation_type}):`, err.message);
      return null;
    }
  }

  /**
   * Fetches chronological audit trail history for a film
   * @param {number} filmId
   * @returns {Promise<Array<TranscodeOperation>>}
   */
  async getFilmHistory(filmId) {
    try {
      const records = await TranscodeOperation.query()
        .where('film_id', filmId)
        .orderBy('created_at', 'asc');
      return records || [];
    } catch (err) {
      console.warn(`[AuditService] Failed to fetch film history for film ${filmId}:`, err.message);
      return [];
    }
  }

  /**
   * Fetches latest recorded operation for a film
   * @param {number} filmId
   * @returns {Promise<TranscodeOperation|null>}
   */
  async getLatestOperation(filmId) {
    try {
      const record = await TranscodeOperation.query()
        .where('film_id', filmId)
        .orderBy('created_at', 'desc')
        .first();
      return record || null;
    } catch (err) {
      console.warn(`[AuditService] Failed to fetch latest operation for film ${filmId}:`, err.message);
      return null;
    }
  }

  /**
   * Fetches operation summary counters for a film
   * @param {number} filmId
   * @returns {Promise<object>}
   */
  async getOperationSummary(filmId) {
    try {
      const history = await this.getFilmHistory(filmId);
      const summary = {
        totalOperations: history.length,
        attempts: 0,
        completedCount: 0,
        failedCount: 0,
        cancelledCount: 0,
        retranscodeCount: 0,
      };

      history.forEach((op) => {
        if (op.attempt > summary.attempts) summary.attempts = op.attempt;
        if (op.operation_type === 'completed') summary.completedCount++;
        if (op.operation_type === 'failed') summary.failedCount++;
        if (op.operation_type === 'cancelled') summary.cancelledCount++;
        if (op.operation_type === 'retranscode') summary.retranscodeCount++;
      });

      return summary;
    } catch (err) {
      return { totalOperations: 0, attempts: 0, completedCount: 0, failedCount: 0, cancelledCount: 0, retranscodeCount: 0 };
    }
  }
}

export const transcodeAuditService = new TranscodeAuditService();
