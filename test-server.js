import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function testServer() {
  try {
    console.log('Testing server endpoint...');

    // Try to make a request to the health check endpoint
    const healthCheck = await execPromise('curl -s http://localhost:4000/api/health');
    console.log('Health check response:', healthCheck.stdout);

    // Try to make a request to the signup endpoint with proper headers
    const signupTest = await execPromise('curl -s -X POST -H "Content-Type: application/json" -d \'{"displayName":"Test User","email":"test@example.com","password":"testpass","primaryProvider":"strava","personaId":"test-persona"}\' http://localhost:4000/api/users/signup');
    console.log('Signup test response:', signupTest.stdout);
  } catch (error) {
    console.log('Test completed. Note: Some errors may be expected if server is not running or DB is not accessible.');
  }
}

console.log("Server test script - Note: This requires the backend server to be running on port 4000");
console.log("To run the server: npm run start:server");
testServer();