/**
 * benchmarks/overhead.bench.ts
 * 
 * Micro-benchmarks validating structural framework overhead.
 */
import { Bench } from 'tinybench';
import { mergeConfig, normalizeHeaders } from '../src/core/utils';

async function runBenchmark() {
  const bench = new Bench({ time: 1000 });

  const defaults = { baseURL: 'https://api.local', headers: { 'X-App': 'Turbo' } };
  const incoming = { headers: { 'Authorization': 'Bearer 123' }, timeout: 5000 };

  bench
    .add('Native Object Spread Syntax', () => {
      const out = { ...defaults, ...incoming, headers: { ...defaults.headers, ...incoming.headers } };
    })
    .add('Turbo Optimized Merge Config', () => {
      const out = mergeConfig(defaults, incoming);
    })
    .add('Turbo Header Normalization', () => {
      normalizeHeaders({ 'Content-Type': 'json', 'X-CUSTOM-HEADER': 'value' });
    });

  await bench.run();
  console.table(bench.table());
}

runBenchmark();
