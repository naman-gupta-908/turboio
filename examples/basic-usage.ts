/**
 * examples/basic-usage.ts
 * 
 * Comprehensive examples demonstrating standard enterprise patterns 
 * using the turboio client.
 */
import turbo from '../src/index';
import { TurboResponseError, TurboTimeoutError } from '../src/errors';

async function runExamples() {
  console.log('--- Starting turboio Examples ---');

  // 1. Basic JSON GET request with typed response
  interface Post {
    id: number;
    title: string;
    body: string;
  }

  try {
    const response = await turbo.get<Post>('https://jsonplaceholder.typicode.com/posts/1');
    console.log('✅ GET Success! Post Title:', response.data.title);
  } catch (error) {
    console.error('❌ GET Failed:', error);
  }

  // 2. Authenticated POST request with custom configurations
  try {
    const api = turbo.create({
      baseURL: 'https://jsonplaceholder.typicode.com',
      headers: {
        'Authorization': 'Bearer turbo_secret_token_123',
        'X-Client-Name': 'TurboEngine'
      },
      timeout: 3000
    });

    const payload = {
      title: 'Architecting turboio',
      body: 'Low allocations make V8 run faster.',
      userId: 42
    };

    const response = await api.post('/posts', payload);
    console.log('✅ POST Success! Status:', response.status, 'ID Created:', response.data.id);
  } catch (error) {
    if (error instanceof TurboTimeoutError) {
      console.error('⏱️ Request timed out before the server responded.');
    } else if (error instanceof TurboResponseError) {
      console.error(`🚫 Server rejected request with status ${error.response?.status}`);
    } else {
      console.error('❌ Unexpected Error:', error);
    }
  }
}

runExamples();
