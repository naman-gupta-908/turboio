/**
 * tests/retry.test.ts
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import turbo from '../src/index';
import { mockAgent } from './setup';
import { TurboResponseError, TurboTimeoutError } from '../src/errors';

const BASE_URL = 'https://api.retry.local';

describe('Turbo Production Features', () => {
  let mockPool: ReturnType<typeof mockAgent.get>;

  beforeEach(() => {
    mockPool = mockAgent.get(BASE_URL);
  });

  afterEach(() => {
    mockAgent.assertNoPendingInterceptors();
  });

  it('should bubble up a structured TurboResponseError on 404', async () => {
    mockPool.intercept({ path: '/not-found', method: 'GET' }).reply(404, { msg: 'Missing' });

    try {
      await turbo.get('/not-found', { baseURL: BASE_URL });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err).toBeInstanceOf(TurboResponseError);
      expect(err.code).toBe('ERR_BAD_RESPONSE_404');
      expect(err.response.status).toBe(404);
      expect(err.response.data).toEqual({ msg: 'Missing' });
    }
  });

  it('should transparently retry idempotent GET requests on 503 failures and succeed', async () => {
    // Attempt 0: Fails with 503
    mockPool.intercept({ path: '/flakey', method: 'GET' }).reply(503, 'Service Unavailable');
    // Attempt 1: Succeeds with 200
    mockPool.intercept({ path: '/flakey', method: 'GET' }).reply(200, { fixed: true }, {
      headers: { 'content-type': 'application/json' }
    });

    const res = await turbo.get('/flakey', {
      baseURL: BASE_URL,
      retry: { retries: 2, retryDelay: 1 } // ultra-short delay for test speed
    });

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ fixed: true });
  });

  it('should refuse to retry unsafe POST requests on 500 failures', async () => {
    mockPool.intercept({ path: '/submit', method: 'POST' }).reply(500, 'Internal Error');

    try {
      await turbo.post('/submit', { test: true }, {
        baseURL: BASE_URL,
        retry: { retries: 5, retryDelay: 1 }
      });
      throw new Error('Should have thrown immediately');
    } catch (err: any) {
      expect(err).toBeInstanceOf(TurboResponseError);
      // Confirms only 1 interception occurred; leftover interceptors assert would fail if it tried retrying
    }
  });
});
