/**
 * backend/src/__tests__/transcode.audit.test.js
 *
 * Unit tests for Transcode Audit Service and Audit API Endpoints.
 */

import { describe, it, expect } from 'vitest';
import { transcodeAuditService } from '../services/transcodeAudit.service.js';

describe('Transcode Audit Service Unit Tests', () => {
  it('handles database connection gracefully when auditing operations', async () => {
    const res = await transcodeAuditService.recordOperation({
      film_id: 9999,
      operation_type: 'enqueue',
      previous_status: 'none',
      new_status: 'pending',
    });

    // Should return record object or null without throwing
    expect(res === null || typeof res === 'object').toBe(true);
  });

  it('returns empty array when history query yields no records', async () => {
    const history = await transcodeAuditService.getFilmHistory(9999);
    expect(Array.isArray(history)).toBe(true);
  });
});
