import turbo from './src/index';

async function run() {
  // 1. Using Query Params
  const users = await turbo.get('/users', {
    baseURL: 'https://jsonplaceholder.typicode.com',
    params: { limit: 10, sort: 'asc' } // Turns into ?limit=10&sort=asc
  });
  console.log('GET Data:', users.data[0]);

  // 2. Sending JSON payloads via POST
  const newUser = await turbo.post('https://jsonplaceholder.typicode.com/users', {
    name: 'Alice Platform Engineer',
    role: 'Admin'
  });
  console.log('POST Status:', newUser.status); // 201 Created

  // 3. Canceling a request
  const controller = new AbortController();
  
  // Trigger abort after 10ms
  setTimeout(() => controller.abort(), 10);
  
  try {
    await turbo.get('https://jsonplaceholder.typicode.com/posts', {
      signal: controller.signal
    });
  } catch (error) {
    console.log('Request was successfully aborted!');
  }
}

run();
