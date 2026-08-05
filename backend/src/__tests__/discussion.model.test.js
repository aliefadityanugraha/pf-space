import { describe, it, expect } from 'vitest';
import { Discussion } from '../models/Discussion.js';

describe('Discussion model', () => {
  it('does not require updated_at during insert', () => {
    const discussion = new Discussion();

    discussion.$beforeInsert();

    expect(discussion.created_at).toBeInstanceOf(Date);
    expect(discussion.updated_at).toBeUndefined();
  });
});
