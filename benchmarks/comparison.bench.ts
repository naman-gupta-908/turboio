/**
 * benchmarks/comparison.bench.ts
 * Absolute Apples-to-Apples Local Server Benchmark
 */
import { bench, run } from 'mitata';
import http from 'node:http';
import axios from 'axios';
import turboBase from '../src/index.js';

// 1. Spin up a real, ultra-fast native HTTP server on a local port
const PORT = 9999;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, data: [1, 2, 3] }));
});

// Start the local server before running the benchmark
server.listen(PORT);

// Automatically kill the server socket when the node process closes or finishes running
process.on('exit', () => {
  server.close();
});

const origin = `http://localhost:${PORT}`;
const path = '/search';

const baseConfig = {
  baseURL: origin,
  headers: { 'X-App-Token': 'secret-123' },
  timeout: 5000,
};

const requestParams = { limit: 10, active: true };

// Initialize pristine instances without any artificial mock wrappers
const turboInstance = turboBase.create(baseConfig);
const axiosInstance = axios.create(baseConfig);

/**
 * TRUE NETWORK EQUALITY
 * Both clients must now pass data through your Mac's local network loopback interface.
 */

bench('Axios [Real Local Network Request]', async () => {
  await axiosInstance.get(path, { params: requestParams });
});

bench('turboio [Real Local Network Request]', async () => {
  await turboInstance.get(path, { params: requestParams });
});

// Execute the standard mitata runner seamlessly

async function main() {
  await run();
  server.close();
  process.exit(0);
}

main();