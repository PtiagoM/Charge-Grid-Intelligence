import { describe, expect, it } from 'vitest';
import { calculateQueuePositions } from '../../src/core/queue.js';

describe('calculateQueuePositions', () => {
  it('atribui posições e tempo estimado', () => {
    const queue = [
      { id: 'Q-001', status: 'waiting' },
      { id: 'Q-002', status: 'waiting' },
      { id: 'Q-003', status: 'waiting' }
    ];
    const result = calculateQueuePositions(queue, 35);
    expect(result[0].position).toBe(1);
    expect(result[0].estimatedWaitMinutes).toBe(35);
    expect(result[2].position).toBe(3);
    expect(result[2].estimatedWaitMinutes).toBe(105);
  });
});
