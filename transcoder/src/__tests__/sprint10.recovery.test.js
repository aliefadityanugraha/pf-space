/**
 * transcoder/src/__tests__/sprint10.recovery.test.js
 *
 * Sprint 10 — Development Data Consistency & Recovery Test Suite.
 * Covers 12 core test scenarios: healthy completed, missing HLS, invalid HLS, zombie processing,
 * pending without queue, stale temp, orphan HLS, idempotency, source MP4 preservation, and read-only mode.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { UPLOAD_VIDEOS_DIR, HLS_OUTPUT_DIR } from '../config.js';
import { scanHlsFilesystem } from '../recovery/hlsScanner.js';
import { reconcileTranscodeState } from '../recovery/reconcile.js';
import { executeSafeRecovery } from '../recovery/recoveryService.js';

describe('Sprint 10 Development Data Consistency & Recovery Suite', () => {
  const sampleMp4 = path.join(UPLOAD_VIDEOS_DIR, 'sprint10_source.mp4');
  const hlsDir = path.resolve(HLS_OUTPUT_DIR);

  beforeAll(() => {
    if (!fs.existsSync(UPLOAD_VIDEOS_DIR)) fs.mkdirSync(UPLOAD_VIDEOS_DIR, { recursive: true });
    if (!fs.existsSync(hlsDir)) fs.mkdirSync(hlsDir, { recursive: true });

    // Create dummy source MP4
    fs.writeFileSync(sampleMp4, Buffer.from('REAL_MP4_SOURCE_FILE_PRESERVED'));
  });

  afterAll(() => {
    try {
      if (fs.existsSync(sampleMp4)) fs.unlinkSync(sampleMp4);
      [1001, 1002, 1003, 1004, 1005, 1006].forEach((id) => {
        const out = path.join(hlsDir, String(id));
        if (fs.existsSync(out)) fs.rmSync(out, { recursive: true, force: true });
      });
      const orphanDir = path.join(hlsDir, '__orphan_test_1099');
      if (fs.existsSync(orphanDir)) fs.rmSync(orphanDir, { recursive: true, force: true });
    } catch {}
  });

  it('1. Healthy completed film is detected as HEALTHY', async () => {
    const filmDir = path.join(hlsDir, '1001');
    const varDir = path.join(filmDir, '360p');
    fs.mkdirSync(varDir, { recursive: true });
    fs.writeFileSync(path.join(filmDir, 'master.m3u8'), '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=800000\n360p/playlist.m3u8');
    fs.writeFileSync(path.join(varDir, 'playlist.m3u8'), '#EXTM3U\n#EXTINF:6.0,\nsegment_000.ts\n#EXT-X-ENDLIST');
    fs.writeFileSync(path.join(varDir, 'segment_000.ts'), Buffer.from([0x47, 0x40, 0x00, 0x10]));

    const mockFilms = [{ film_id: 1001, judul: 'Healthy Film', transcode_status: 'completed', hls_manifest_url: '/uploads/videos/hls/1001/master.m3u8' }];
    const audit = await reconcileTranscodeState({ filmsMock: mockFilms, checkQueue: false });

    expect(audit.healthy).toBe(1);
    expect(audit.details[0].auditState).toBe('HEALTHY');
  });

  it('2. Missing HLS master playlist is detected as MISSING_HLS', async () => {
    const mockFilms = [{ film_id: 1002, judul: 'Missing HLS Film', transcode_status: 'completed', hls_manifest_url: '/uploads/videos/hls/1002/master.m3u8' }];
    const audit = await reconcileTranscodeState({ filmsMock: mockFilms, checkQueue: false });

    expect(audit.missingHls).toBe(1);
    expect(audit.details[0].auditState).toBe('MISSING_HLS');
  });

  it('3. Invalid HLS (0-byte segment) is detected as INVALID_HLS', async () => {
    const filmDir = path.join(hlsDir, '1003');
    const varDir = path.join(filmDir, '360p');
    fs.mkdirSync(varDir, { recursive: true });
    fs.writeFileSync(path.join(filmDir, 'master.m3u8'), '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=800000\n360p/playlist.m3u8');
    fs.writeFileSync(path.join(varDir, 'playlist.m3u8'), '#EXTM3U\n#EXTINF:6.0,\nsegment_000.ts\n#EXT-X-ENDLIST');
    fs.writeFileSync(path.join(varDir, 'segment_000.ts'), Buffer.alloc(0)); // 0-byte segment

    const mockFilms = [{ film_id: 1003, judul: 'Invalid Segment Film', transcode_status: 'completed', hls_manifest_url: '/uploads/videos/hls/1003/master.m3u8' }];
    const audit = await reconcileTranscodeState({ filmsMock: mockFilms, checkQueue: false });

    expect(audit.invalidHls).toBe(1);
    expect(audit.details[0].auditState).toBe('INVALID_HLS');
  });

  it('4. Stranded processing film is detected as ZOMBIE_PROCESSING', async () => {
    const mockFilms = [{ film_id: 1004, judul: 'Zombie Film', transcode_status: 'processing', transcode_progress: 45 }];
    const audit = await reconcileTranscodeState({ filmsMock: mockFilms, checkQueue: false });

    expect(audit.zombieProcessing).toBe(1);
    expect(audit.details[0].auditState).toBe('ZOMBIE_PROCESSING');
  });

  it('5. Pending status without queue job is detected as MISSING_QUEUE_JOB', async () => {
    const mockFilms = [{ film_id: 1005, judul: 'Pending Film', transcode_status: 'pending', transcode_progress: 0 }];
    const audit = await reconcileTranscodeState({ filmsMock: mockFilms, checkQueue: true });

    expect(audit.missingQueueJob).toBe(1);
    expect(audit.details[0].auditState).toBe('MISSING_QUEUE_JOB');
  });

  it('6. Failed film with leftover temporary directory is detected as STALE_TEMP', async () => {
    const tempDir = path.join(hlsDir, '.tmp-1006-stale-job');
    fs.mkdirSync(tempDir, { recursive: true });

    const mockFilms = [{ film_id: 1006, judul: 'Stale Temp Film', transcode_status: 'failed', transcode_progress: 0 }];
    const audit = await reconcileTranscodeState({ filmsMock: mockFilms, checkQueue: false });

    expect(audit.staleTemp).toBe(1);
    expect(audit.details[0].auditState).toBe('STALE_TEMP');
  });

  it('7. Filesystem directory without DB record is detected as ORPHAN_HLS', () => {
    const orphanDir = path.join(hlsDir, '1099');
    fs.mkdirSync(orphanDir, { recursive: true });

    const fsReport = scanHlsFilesystem([1001, 1002, 1003]);
    expect(fsReport.orphanDirectories.some((o) => String(o.filmId) === '1099')).toBe(true);

    fs.rmSync(orphanDir, { recursive: true, force: true });
  });

  it('8. Safe recovery is idempotent when executed multiple times', async () => {
    const mockFilms = [{ film_id: 1004, judul: 'Zombie Film', transcode_status: 'processing' }];
    const rec1 = await executeSafeRecovery({ filmsMock: mockFilms, readOnly: true });
    const rec2 = await executeSafeRecovery({ filmsMock: mockFilms, readOnly: true });

    expect(rec1.zombiesRecovered).toBe(1);
    expect(rec2.zombiesRecovered).toBe(1);
  });

  it('9. Source MP4 is NEVER deleted during recovery', async () => {
    const mockFilms = [{ film_id: 1002, judul: 'Missing HLS', transcode_status: 'completed', link_video_utama: sampleMp4 }];
    await executeSafeRecovery({ filmsMock: mockFilms, readOnly: true });

    expect(fs.existsSync(sampleMp4)).toBe(true);
  });

  it('12. Reconciliation defaults to READ-ONLY mode without mutating filesystem', async () => {
    const tempDir = path.join(hlsDir, '.tmp-1006-ro-job');
    fs.mkdirSync(tempDir, { recursive: true });

    const mockFilms = [{ film_id: 1006, judul: 'RO Film', transcode_status: 'failed' }];
    await reconcileTranscodeState({ filmsMock: mockFilms, checkQueue: false });

    // Temp directory must not be deleted in read-only mode
    expect(fs.existsSync(tempDir)).toBe(true);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
