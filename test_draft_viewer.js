// Test script to verify draft viewing functionality
import http from 'http';

// Test with the session ID from the previous test
const sessionId = '550e8400-e29b-41d4-a716-446655440000';

console.log('🚀 Testing draft viewer endpoint...');
console.log(`Session ID: ${sessionId}`);

// Simulate a request to check if the draft can be viewed
const options = {
  hostname: 'localhost',
  port: 3001,
  path: `/api/drafts/${sessionId}`,
  method: 'GET',
  timeout: 30000 // 30 second timeout
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`✅ Response received in ${Date.now() - startTime}ms`);
    console.log(`Response status: ${res.statusCode}`);
    
    if (res.statusCode === 200) {
      try {
        const responseData = JSON.parse(data);
        console.log('Response data:', JSON.stringify(responseData, null, 2));
        console.log('✅ Draft viewer test passed!');
      } catch (parseError) {
        console.log('Raw response:', data);
      }
    } else {
      console.log('Response error:', data);
      console.log('❌ Draft viewer test failed');
    }
  });
});

const startTime = Date.now();

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
  console.log('❌ Draft viewer test failed');
});

req.on('timeout', () => {
  console.error('❌ Request timeout after 30 seconds');
  req.destroy();
  console.log('❌ Draft viewer test failed');
});

req.end();