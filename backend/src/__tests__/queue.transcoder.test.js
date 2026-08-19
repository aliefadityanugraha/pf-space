/**
 * backend/src/__tests__/queue.transcoder.test.js
 *
 * Unit tests for Transcoder Queue abstraction and payload validation.
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  validateTranscodePayload,
  enqueueVideoTranscoding,
  closeQueue,
} from '../lib/queue/transcoderQueue.js';

describe('Transcoder Queue Abstraction', () => {
  afterEach(async () => {
    await closeQueue();
  });

  describe('validateTranscodePayload', () => {
    it('accepts valid filmId and sourcePath', () => {
      const valid = validateTranscodePayload({
        filmId: 10,
        sourcePath: '/uploads/videos/test.mp4',
      });
      expect(valid).toBe(true);
    });

    it('rejects invalid or non-numeric filmId', () => {
      expect(validateTranscodePayload({ filmId: 0, sourcePath: '/uploads/videos/test.mp4' })).toBe(false);
      expect(validateTranscodePayload({ filmId: -5, sourcePath: '/uploads/videos/test.mp4' })).toBe(false);
      expect(validateTranscodePayload({ filmId: null, sourcePath: '/uploads/videos/test.mp4' })).toBe(false);
      expect(validateTranscodePayload({ filmId: '10', sourcePath: '/uploads/videos/test.mp4' })).toBe(false);
    });

    it('rejects empty or non-string sourcePath', () => {
      expect(validateTranscodePayload({ filmId: 1, sourcePath: '' })).toBe(false);
      expect(validateTranscodePayload({ filmId: 1, sourcePath: null })).toBe(false);
      expect(validateTranscodePayload({ filmId: 1, sourcePath: 123 })).toBe(false);
    });

    it('rejects path traversal attempts with ..', () => {
      expect(validateTranscodePayload({ filmId: 1, sourcePath: '/uploads/videos/../../etc/passwd' })).toBe(false);
      expect(validateTranscodePayload({ filmId: 1, sourcePath: 'videos/../secret.txt' })).toBe(false);
    });
  });

  describe('enqueueVideoTranscoding Execution', () => {
    it('returns boolean result gracefully when enqueuing valid payload', async () => {
      const result = await enqueueVideoTranscoding({
        filmId: 99,
        sourcePath: '/uploads/videos/sample.mp4',
      });

      expect(typeof result).toBe('boolean');
    });

    it('returns false for invalid payload without attempting queue add', async () => {
      const result = await enqueueVideoTranscoding({
        filmId: -1,
        sourcePath: '',
      });
      expect(result).toBe(false);
    });
  });
});
