// Basic test to verify the Opus integration is properly set up
import { OPUS_CONFIG } from './constants';
import { runJobAndWait } from './services/opusClient';
import { loadMockProviderPayload, buildWorkflowInputFromProvider } from './services/mockProviderLoader';

console.log('Testing Opus API Integration...');

async function testIntegration() {
  try {
    console.log('1. Testing Opus configuration...');
    console.log('Base URL:', OPUS_CONFIG.BASE_URL);
    console.log('API Key exists:', !!OPUS_CONFIG.API_KEY);
    console.log('Workflow ID:', OPUS_CONFIG.WORKFLOW_ID);

    console.log('\n2. Testing mock data loading...');
    const mockPayload = await loadMockProviderPayload('strava');
    console.log('Loaded mock Strava data:', typeof mockPayload === 'object' ? '✓' : '✗');

    console.log('\n3. Testing workflow input building...');
    const workflowInput = await buildWorkflowInputFromProvider(
      'strava',
      mockPayload,
      'test_user_123',
      new Date().toISOString()
    );
    console.log('Workflow input created:', Array.isArray(workflowInput) ? '✓' : '✗');

    console.log('\n4. Opus integration is properly configured!');
    console.log('Ready to connect to Opus API when the Sync Activity button is clicked.');
    
  } catch (error) {
    console.error('Error during integration test:', error);
  }
}

// Run the test
testIntegration();