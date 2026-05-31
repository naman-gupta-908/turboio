/**
 * examples/plugin-demo.ts
 * 
 * Demonstrates how to create and register an operational performance logging plugin.
 */
import turbo from '../src/index';
import { TurboContext, TurboNext } from '../src/types';

// 1. Define a high-fidelity performance telemetry plugin
async function timingLoggerPlugin(ctx: TurboContext, next: TurboNext) {
  const start = performance.now();
  console.log(`📡 [Plugin Outbound] Sending ${ctx.method} to ${ctx.url}`);
  
  // Inject a custom header on the fly down to the transport layer
  ctx.request.headers = ctx.request.headers || {};
  ctx.request.headers['X-Turbo-Plugin'] = 'Active';

  // Yield execution to the next plugin / core request handler
  await next();

  // Execution flows back up the onion layer once the network request resolves
  const duration = performance.now() - start;
  console.log(`✅ [Plugin Inbound] Received Response! Status: ${ctx.response?.status} (${duration.toFixed(2)}ms)`);
}

async function runDemo() {
  const api = turbo.create({
    baseURL: 'https://jsonplaceholder.typicode.com'
  });

  // Register our newly created plugin
  api.use(timingLoggerPlugin);

  // Execute a standard GET request
  await api.get('/posts/1');
}

runDemo();
