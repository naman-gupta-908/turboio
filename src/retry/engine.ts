/**
 * src/retry/engine.ts
 * 
 * Logic for exponential backoff, jitter, and idempotency evaluation.
 */
import { HttpMethod, RetryConfig } from '../types/index.js';

/**
 * Sleeps for a designated amount of time
 */
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Evaluates whether an HTTP method can safely be retried.
 * Standard HTTP specification dictates GET, HEAD, OPTIONS, and PUT are idempotent.
 */
export function isIdempotent(method: HttpMethod): boolean {
  return ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'].includes(method);
}

/**
 * Computes backoff delay using an exponential curve mixed with random jitter.
 * Formula: Delay = min(retryDelay * 2^attempt, maxDelay) + random_jitter
 */
export function calculateBackoff(attempt: number, config: RetryConfig): number {
  const baseDelay = config.retryDelay ?? 1000;
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  
  // Apply pseudo-random jitter (0% to 50% reduction to smooth out microservice traffic bursts)
  const jitter = Math.random() * 0.5 * exponentialDelay;
  return exponentialDelay - jitter;
}
