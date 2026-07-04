import { describe, it, expect } from 'vitest';
import { Vote } from '../models/Vote.js';

describe('Vote model', () => {
  it('does not require updated_at during insert', () => {
    const vote = new Vote();

    vote.$beforeInsert();

    expect(vote.created_at).toBeInstanceOf(Date);
    expect(vote.updated_at).toBeUndefined();
  });
});
