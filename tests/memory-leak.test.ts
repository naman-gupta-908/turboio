/**
 * tests/memory-leak.test.ts
 * 
 * Programmatic memory leak detection using Node.js garbage collection tracking.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import turbo from '../src/index';
import { mockAgent } from './setup';

const BASE_URL = 'https://api.memory.local';

describe('Turbo Memory Isolation', () => {
  let mockPool: ReturnType<typeof mockAgent.get>;

  beforeEach(() => {
    mockPool = mockAgent.get(BASE_URL);
  });

  afterEach(() => {
    mockAgent.assertNoPendingInterceptors();
  });

  it('should maintain stable heap memory across intensive cyclical requests', async () => {
    const batches = 15;
    const requestsPerBatch = 1000;

    // Define standard interceptor for recycling requests
    mockPool.intercept({
      path: '/ping',
      method: 'GET'
    }).reply(200, { status: 'pong' }, {
      headers: { 'content-type': 'application/json' }
    }).persist(); // Use persist to cleanly re-use this interceptor across thousands of cycles

    // Explicitly run global garbage collection if exposed by the runtime environment
    if (global.gc) {
      global.gc();
    }

    // Capture baseline memory allocation stats
    const initialHeap = process.memoryUsage().heapUsed;

    // Run intensive loops to force accumulation of any dangling scopes or context leaks
    for (let b = 0; b < batches; b++) {
      const batchPromises = Array.from({ length: requestsPerBatch }, () => 
        turbo.get('/ping', { baseURL: BASE_URL })
      );
      await Promise.all(batchPromises);
    }

    if (global.gc) {
      global.gc();
    }

    const postExecutionHeap = process.memoryUsage().heapUsed;
    const memoryDiff = postExecutionHeap - initialHeap;

    // Validate that our memory consumption growth does not scale unboundedly.
    // We expect delta variance to remain minimal due to zero-prototype fast path caching.
    const maxAllowedLeakInBytes = 12 * 1024 * 1024; // Strict 12MB variance boundary for 15,000 requests
    expect(memoryDiff).toBeLessThan(maxAllowedLeakInBytes);
  });
});
