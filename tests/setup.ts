/**
 * tests/setup.ts
 * 
 * Global test setup. Configures the undici MockAgent to intercept all requests,
 * ensuring no real network calls are made during the test suite.
 */
import { MockAgent, setGlobalDispatcher } from 'undici';
import { beforeAll, afterAll } from 'vitest';
import vm from 'node:vm';
import v8 from 'node:v8';

export const mockAgent = new MockAgent();

beforeAll(() => {
  if (!global.gc) {
    v8.setFlagsFromString('--expose_gc');
    global.gc = vm.runInNewContext('gc');
  }

  // Disable real network connections completely
  mockAgent.disableNetConnect();
  // Set our mock agent as the global dispatcher for undici
  setGlobalDispatcher(mockAgent);
});

afterAll(async () => {
  // Clean up and close the agent after all tests finish
  await mockAgent.close();
});
