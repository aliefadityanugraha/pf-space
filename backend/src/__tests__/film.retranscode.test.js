/**
 * backend/src/__tests__/film.retranscode.test.js
 *
 * Unit tests for Film retranscode service & API functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FilmService } from '../services/film.service.js';
import { Film } from '../models/Film.js';
import * as transcoderQueue from '../lib/queue/transcoderQueue.js';

vi.mock('../models/Film.js');
vi.mock('../lib/queue/transcoderQueue.js');

describe('FilmService.retranscode', () => {
  let filmService;

  beforeEach(() => {
    filmService = new FilmService();
    vi.clearAllMocks();
  });

  it('resets status to pending and enqueues transcoding for a valid film with video URL', async () => {
    const mockFilm = {
      film_id: 42,
      judul: 'Test Film',
      link_video_utama: '/uploads/videos/sample.mp4',
      transcode_status: 'failed',
    };

    const updatedFilm = { ...mockFilm, transcode_status: 'pending' };

    const mockQuery = {
      findById: vi.fn().mockImplementation((id) => {
        return Promise.resolve(mockFilm);
      }),
      patch: vi.fn().mockResolvedValue(1),
    };

    // Subsequent call after patch returns updatedFilm
    let callCount = 0;
    Film.query.mockImplementation(() => {
      callCount++;
      return {
        findById: vi.fn().mockImplementation((id) => {
          return {
            patch: vi.fn().mockResolvedValue(1),
            then: (cb) => cb(callCount > 1 ? updatedFilm : mockFilm),
          };
        }),
      };
    });

    transcoderQueue.enqueueVideoTranscoding.mockResolvedValue(true);

    const result = await filmService.retranscode(42);

    expect(transcoderQueue.enqueueVideoTranscoding).toHaveBeenCalledWith({
      filmId: 42,
      sourcePath: '/uploads/videos/sample.mp4',
    });
    expect(result.film_id).toBe(42);
  });

  it('throws NotFoundError if film does not exist', async () => {
    Film.query.mockReturnValue({
      findById: vi.fn().mockResolvedValue(null),
    });

    await expect(filmService.retranscode(9999)).rejects.toThrow('Film tidak ditemukan');
  });

  it('throws Error if film does not have a valid main video link', async () => {
    const mockFilm = {
      film_id: 43,
      judul: 'No Video Film',
      link_video_utama: null,
    };

    Film.query.mockReturnValue({
      findById: vi.fn().mockResolvedValue(mockFilm),
    });

    await expect(filmService.retranscode(43)).rejects.toThrow('tidak memiliki berkas video utama');
  });
});
