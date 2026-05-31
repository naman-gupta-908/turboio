/**
 * benchmarks/profile-run.ts
 * 
 * High-throughput execution script designed to stress-test turboio
 * and trigger diagnostic data collection in the V8 engine.
 */
import http from 'http';
import turbo from '../src/index';

async function startProfilingSession() {
  // 1. Create an ultra-lean native target server
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
  });

  // Listen on a dynamically allocated local port
  server.listen(0);
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Failed to bind server');
  
  const baseUrl = `http://localhost:${address.port}`;
  console.log(`🚀 Target profiling server online at ${baseUrl}`);

  // 2. Configure our optimized turboio instance
  const api = turbo.create({
    baseURL: baseUrl,
    timeout: 2000,
  });

  const TOTAL_REQUESTS = 50000;
  const BATCH_SIZE = 500;
  
  console.log(`🏋️ Starting execution of ${TOTAL_REQUESTS} requests in batches of ${BATCH_SIZE}...`);
  const startTime = performance.now();

  // 3. Execute request groups sequentially to measure sustained load
  for (let i = 0; i < TOTAL_REQUESTS; i += BATCH_SIZE) {
    const batch = Array.from({ length: BATCH_SIZE }, () => api.get('/json-endpoint'));
    await Promise.all(batch);
  }

  const duration = performance.now() - startTime;
  console.log(`⏱️ Completed ${TOTAL_REQUESTS} requests in ${duration.toFixed(2)}ms`);
  console.log(`📊 Throughput: ${(TOTAL_REQUESTS / (duration / 1000)).toFixed(0)} requests/sec`);

  // 4. Clean up server sockets
  server.close();
}

startProfilingSession().catch(console.error);
