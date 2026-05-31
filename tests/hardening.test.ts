/**
 * tests/hardening.test.ts
 * 
 * Concurrency, race condition, and cancellation hardening tests.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import turbo from '../src/index';
import { mockAgent } from './setup';
import { TurboTimeoutError } from '../src/errors';

const BASE_URL = 'https://api.hardening.local';

describe('Turbo Client Hardening', () => {
  let mockPool: ReturnType<typeof mockAgent.get>;

  beforeEach(() => {
    mockPool = mockAgent.get(BASE_URL);
  });

  afterEach(() => {
    mockAgent.assertNoPendingInterceptors();
  });

  it('should handle high-concurrency request bursts smoothly', async () => {
    const totalRequests = 200;
    
    // Intercept 200 parallel requests with individual dynamic mock responses
    for (let i = 0; i < totalRequests; i++) {
      mockPool.intercept({
        path: `/item/${i}`,
        method: 'GET'
      }).reply(200, { index: i }, {
        headers: { 'content-type': 'application/json' }
      });
    }

    // Fire all 200 requests concurrently via Promise.all
    const promises = Array.from({ length: totalRequests }, (_, i) => 
      turbo.get(`/item/${i}`, { baseURL: BASE_URL })
    );

    const results = await Promise.all(promises);

    // Assert that every single parallel request resolved successfully with pure integrity
    expect(results.length).toBe(totalRequests);
    results.forEach((res, i) => {
      expect(res.status).toBe(200);
      expect(res.data).toEqual({ index: i });
    });
  });

  it('should immediately halt execution when an abort signal is fired during connection phase', async () => {
    // Mock a response with a high artificial delay
    mockPool.intercept({
      path: '/delayed',
      method: 'GET'
    }).reply(200, { success: true }).delay(200);

    const controller = new AbortController();

    // Trigger the cancellation after 20ms, midway through execution
    setTimeout(() => {
      controller.abort();
    }, 20);

    // The execution should reject instantly with a DOMException or AbortError
    await expect(
      turbo.get('/delayed', {
        baseURL: BASE_URL,
        signal: controller.signal
      })
    ).rejects.toThrow();
  });
});