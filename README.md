# turboio 🚀

### Axios-like developer experience powered by modern high-performance internals.

`turboio` is an enterprise-grade, zero-dependency HTTP client engineered specifically for high-throughput Node.js environments. It combines the familiar API ergonomics of Axios with the efficient connection management and transport capabilities of `undici`—Node.js' official HTTP client and the foundation of the native `fetch()` implementation.

![MIT License](https://img.shields.io/badge/License-MIT-green.svg)
![Node Target](https://img.shields.io/badge/Node-v18%2B-blue.svg)
![ESM & CJS Compatible](https://img.shields.io/badge/module-ESM%20%2F%20CJS-orange.svg)

---

## Why turboio?

Most HTTP clients force teams to choose between:

* Familiar developer ergonomics
* Efficient transport-layer performance

`turboio` is designed to provide both.

Built on top of `undici`, it offers an Axios-inspired API while being optimized for lower overhead, reduced memory churn, and high-throughput workloads.

### Highlights

✅ Axios-inspired API

✅ Powered by `undici`

✅ Native `AbortSignal` support

✅ Built-in retry engine

✅ Onion-style middleware architecture

✅ Cross-runtime-safe error handling

✅ Zero runtime dependencies

✅ ESM and CommonJS compatibility

✅ TypeScript-first design

---

## ⚡ Performance Philosophy

`turboio` is designed around a simple goal:

> Deliver a familiar developer experience while minimizing unnecessary abstraction and runtime overhead.

The library focuses on:

* Efficient request execution paths
* Reduced allocation pressure
* Native platform APIs
* Connection reuse through `undici`
* Predictable behavior under sustained load

### Benchmark Methodology

The benchmark suite:

* Spins up a native Node.js HTTP server
* Executes real asynchronous HTTP requests
* Uses identical request configurations for all clients
* Routes traffic through the operating system's loopback interface (`localhost`)
* Avoids mocks, stubs, adapters, and synthetic shortcuts
* Measures complete request lifecycle execution

Benchmark source:

```text
/benchmarks/comparison.bench.ts
```

Run locally:

```bash
npm run bench
```

Benchmark results may vary based on:

* CPU architecture
* Node.js version
* Operating system
* Runtime load
* Network stack characteristics

For meaningful comparisons, benchmark on the same environment where your application will run.

---

## 🏗️ Architecture

`turboio` uses a layered onion-style request pipeline inspired by Koa.js, combining composable middleware with a modern transport layer.

### Onion Middleware Stack

Intercept, inspect, mutate, or log outbound requests and inbound responses using asynchronous middleware chaining.

### Intelligent Retry Engine

Built-in retry support automatically handles transient network failures and safe retry scenarios for idempotent requests while protecting mutation operations from accidental double execution.

### Cross-Realm Error Safety

Custom error classes implement robust runtime identity validation (`Symbol.hasInstance`) to ensure reliable `instanceof` checks across:

* Monorepos
* Worker threads
* Test runners
* Bundled applications
* Mixed runtime contexts

---

## ⚙️ Axios Compatibility

| Axios Feature    | turboio Equivalent            | Optimization                  |
| ---------------- | ------------------------------- | ----------------------------- |
| `axios.create()` | `turbo.create()`                | Optimized immutable defaults  |
| `CancelToken`    | Native `AbortSignal`            | Standards-based cancellation  |
| `isAxiosError`   | `instanceof TurboResponseError` | Native TypeScript inheritance |
| `response.data`  | `response.data`                 | Familiar API contract         |
| Retry plugins    | Built-in retry engine           | No additional dependencies    |

---

## 📦 Installation

```bash
npm install @naman-gupta/turboio
```

---

## 🚀 Quick Start

### Create a Client

```ts
import turbo from '@naman-gupta/turboio';

const api = turbo.create({
  baseURL: 'https://api.yourdomain.local',
  timeout: 5000,
  headers: {
    Authorization: 'Bearer token_123'
  }
});
```

### Make Requests

```ts
interface User {
  id: string;
  name: string;
}

const response = await api.get<User>('/users/current', {
  params: {
    limit: 10,
    active: true
  }
});

console.log(response.status);
console.log(response.data.name);
```

### Error Handling

```ts
import turbo, {
  TurboResponseError,
  TurboTimeoutError
} from 'turboio';

try {
  await api.post('/data', {
    item: 'value'
  });
} catch (err) {
  if (err instanceof TurboTimeoutError) {
    console.error('Request timed out.');
  }

  if (err instanceof TurboResponseError) {
    console.error(err.code);
    console.error(err.response.status);
    console.error(err.response.data);
  }
}
```

---

## 🔌 Middleware

`turboio` supports asynchronous onion-style middleware.

```ts
import turbo from '@naman-gupta/turboio';

const client = turbo.create();

client.use(async (ctx, next) => {
  const start = performance.now();

  await next();

  const duration = performance.now() - start;

  console.log(
    `[HTTP] ${ctx.method} ${ctx.url} completed in ${duration.toFixed(2)}ms`
  );
});

await client.post(
  'https://httpbin.org/post',
  { hello: 'world' }
);
```

---

## 🧪 Development

### Clone Repository

```bash
git clone https://github.com/naman-gupta-908/turboio.git

cd turboio

npm install
```

### Build

Build ESM and CommonJS distributions using `tsup`.

```bash
npm run build
```

### Run Tests

Execute the test suite.

```bash
npm run test
```

### Run Benchmarks

Execute the benchmark suite.

```bash
npm run bench
```

Benchmark source:

```text
/benchmarks/comparison.bench.ts
```

---

## 📄 License

Distributed under the MIT License.

See the `LICENSE` file for more information.
