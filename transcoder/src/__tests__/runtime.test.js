/**
 * transcoder/src/__tests__/runtime.test.js
 *
 * Unit tests for cross-platform Transcoder Runtime Health Checker.
 */

import { describe, it, expect } from 'vitest';
import path from 'path';
import { checkRuntime } from '../runtime/checkRuntime.js';
import { resolveAndValidateSourcePath } from '../paths.js';

describe('Cross-Platform Transcoder Runtime & Path Resolution', () => {
  describe('Path Resolution Abstraction', () => {
    it('resolves Windows-style relative paths safely', () => {
      const res = resolveAndValidateSourcePath('\\uploads\\videos\\nonexistent.mp4');
      // Should normalize slash and return structured validation
      expect(res).toHaveProperty('valid');
      expect(typeof res.valid).toBe('boolean');
    });

    it('resolves Linux-style relative paths safely', () => {
      const res = resolveAndValidateSourcePath('/uploads/videos/nonexistent.mp4');
      expect(res).toHaveProperty('valid');
      expect(typeof res.valid).toBe('boolean');
    });
  });

  describe('checkRuntime Health Checker', () => {
    it('returns a comprehensive runtime report structure', async () => {
      const report = await checkRuntime();

      expect(report).toHaveProperty('status');
      expect(['READY', 'NOT_READY']).toContain(report.status);
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('system');
      expect(report.system).toHaveProperty('platform');
      expect(report.system).toHaveProperty('nodeVersion');
      expect(report.system).toHaveProperty('cpuCount');
      expect(report).toHaveProperty('redis');
      expect(report.redis).toHaveProperty('ready');
      expect(report).toHaveProperty('ffmpeg');
      expect(report.ffmpeg).toHaveProperty('ready');
      expect(report).toHaveProperty('ffprobe');
      expect(report.ffprobe).toHaveProperty('ready');
      expect(report).toHaveProperty('filesystem');
      expect(report.filesystem).toHaveProperty('uploadDirReadable');
      expect(report.filesystem).toHaveProperty('hlsOutputDirWritable');
      expect(report).toHaveProperty('concurrency');
      expect(report).toHaveProperty('blockers');
      expect(Array.isArray(report.blockers)).toBe(true);
    });

    it('gracefully reports NOT_READY without crashing when dependencies are missing', async () => {
      const report = await checkRuntime();
      
      if (!report.redis.ready || !report.ffmpeg.ready || !report.ffprobe.ready) {
        expect(report.status).toBe('NOT_READY');
        expect(report.blockers.length).toBeGreaterThan(0);
      } else {
        expect(report.status).toBe('READY');
        expect(report.blockers.length).toBe(0);
      }
    });
  });
});
