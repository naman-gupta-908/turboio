/**
 * tests/client.test.ts
 * 
 * Validates the core functionality of the Turbo HTTP client.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import turbo from '../src/index';
import { mockAgent } from './setup';

const BASE_URL = 'https://api.turboio.local';

describe('Turbo Core Client', () => {
  let mockPool: ReturnType<typeof mockAgent.get>;

  beforeEach(() => {
    // Create an interceptor pool for our dummy domain
    mockPool = mockAgent.get(BASE_URL);
  });

  afterEach(() => {
    // Ensure all mocks were consumed (no leftover expected requests)
    mockAgent.assertNoPendingInterceptors();
  });

  it('should successfully execute a GET request', async () => {
    // Arrange: Tell the mock agent what to expect and what to return
    mockPool.intercept({
      path: '/users',
      method: 'GET',
    }).reply(200, {
      id: 1,
      name: 'Alice',
    }, {
      headers: { 'content-type': 'application/json' }
    });

    // Act: Execute our client code
    const response = await turbo.get('/users', { baseURL: BASE_URL });

    // Assert: Verify the response matches our API contract
    expect(response.status).toBe(200);
    expect(response.data).toEqual({ id: 1, name: 'Alice' });
  });

  it('should correctly serialize query parameters', async () => {
    // Arrange
    mockPool.intercept({
      path: '/search?limit=10&active=true',
      method: 'GET',
    }).reply(200, { success: true }, {
      headers: { 'content-type': 'application/json' }
    });

    // Act
    const response = await turbo.get('/search', {
      baseURL: BASE_URL,
      params: { limit: 10, active: true }
    });

    // Assert
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  it('should stringify JSON bodies and auto-set headers on POST', async () => {
    const payload = { role: 'engineer' };

    // Arrange: Verify the body is stringified and the header is present
    mockPool.intercept({
      path: '/users',
      method: 'POST',
      body: JSON.stringify(payload), // Strict matching on the serialized body
      headers: (headers) => headers['content-type'] === 'application/json',
    }).reply(201, { id: 2, ...payload }, {
      headers: { 'content-type': 'application/json' }
    });

    // Act
    const response = await turbo.post('/users', payload, { baseURL: BASE_URL });

    // Assert
    expect(response.status).toBe(201);
    expect(response.data.id).toBe(2);
    expect(response.data.role).toBe('engineer');
  });

  it('should respect the timeout configuration', async () => {
    // Arrange: Simulate a delayed response
    mockPool.intercept({
      path: '/slow',
      method: 'GET',
    }).reply(200, { success: true }).delay(50); // 50ms delay

    // Act & Assert: The request should throw due to the 10ms timeout
    await expect(
      turbo.get('/slow', { baseURL: BASE_URL, timeout: 10 })
    ).rejects.toThrow();
  });
});