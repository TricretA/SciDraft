import { GoogleGenerativeAI } from '@google/generative-ai';
import https from 'https';
import dns from 'dns';
import { promisify } from 'util';

const dnsResolve = promisify(dns.resolve);

async function diagnoseGeminiNetwork() {
  console.log('=== Gemini API Network Diagnosis ===\n');
  
  // 1. Check DNS resolution
  console.log('1. Testing DNS resolution...');
  try {
    const addresses = await dnsResolve('generativelanguage.googleapis.com');
    console.log('✅ DNS resolution successful:', addresses);
  } catch (error) {
    console.error('❌ DNS resolution failed:', error.message);
    console.log('   → Check your DNS settings or network configuration');
    return;
  }
  
  // 2. Test HTTPS connectivity
  console.log('\n2. Testing HTTPS connectivity to Google APIs...');
  try {
    await testHttpsConnectivity('generativelanguage.googleapis.com', 443);
    console.log('✅ HTTPS connectivity successful');
  } catch (error) {
    console.error('❌ HTTPS connectivity failed:', error.message);
    console.log('   → Check firewall settings or proxy configuration');
  }
  
  // 3. Test specific Gemini API endpoint
  console.log('\n3. Testing Gemini API endpoint...');
  try {
    await testGeminiEndpoint();
    console.log('✅ Gemini API endpoint accessible');
  } catch (error) {
    console.error('❌ Gemini API endpoint failed:', error.message);
    console.log('   → This might indicate API service issues or regional restrictions');
  }
  
  // 4. Test with different User-Agent headers
  console.log('\n4. Testing with different headers...');
  try {
    await testWithDifferentHeaders();
  } catch (error) {
    console.error('Header test failed:', error.message);
  }
  
  // 5. Check for proxy issues
  console.log('\n5. Checking for proxy configuration...');
  checkProxySettings();
  
  console.log('\n=== Diagnosis Summary ===');
  console.log('Common solutions for "fetch failed" errors:');
  console.log('1. Check if you\'re behind a corporate firewall or proxy');
  console.log('2. Try using a different network (mobile hotspot)');
  console.log('3. Check if Google APIs are blocked in your region');
  console.log('4. Try using a VPN to test connectivity');
  console.log('5. Check Node.js version compatibility (v18+ recommended)');
  console.log('6. Try updating the @google/generative-ai package');
}

function testHttpsConnectivity(hostname, port) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port,
      path: '/',
      method: 'GET',
      timeout: 5000
    };
    
    const req = https.request(options, (res) => {
      console.log(`   Status Code: ${res.statusCode}`);
      console.log(`   Status Message: ${res.statusMessage}`);
      resolve();
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function testGeminiEndpoint() {
  const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyApDWgDSJ_tohn9ufNlPLV8Z35eyganK6s';
  
  const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: `/v1beta/models/gemini-2.5-flash?key=${apiKey}`,
    method: 'GET',
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Gemini API endpoint responded successfully');
          console.log(`   Response length: ${data.length} characters`);
        } else {
          console.log(`⚠️  Gemini API endpoint returned status ${res.statusCode}`);
          console.log(`   Response: ${data.substring(0, 200)}`);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Gemini API endpoint error:', error.message);
      console.log('   Error code:', error.code);
      console.log('   Error syscall:', error.syscall);
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Gemini API endpoint timeout'));
    });
    
    req.end();
  });
}

async function testWithDifferentHeaders() {
  const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyApDWgDSJ_tohn9ufNlPLV8Z35eyganK6s';
  
  const headersList = [
    { 'User-Agent': 'Node.js/18.0.0' },
    { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    { 'User-Agent': 'Google-API-Client/1.0' },
    {}
  ];
  
  for (let i = 0; i < headersList.length; i++) {
    console.log(`   Testing with header set ${i + 1}...`);
    
    try {
      await testGeminiWithHeaders(headersList[i], apiKey);
      console.log('   ✅ Success with this header set');
      break;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }
}

function testGeminiWithHeaders(headers, apiKey) {
  const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: `/v1beta/models/gemini-2.5-flash?key=${apiKey}`,
    method: 'GET',
    timeout: 5000,
    headers: headers
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        resolve();
      } else {
        reject(new Error(`Status ${res.statusCode}`));
      }
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.end();
  });
}

function checkProxySettings() {
  const proxyVars = ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'NO_PROXY', 'no_proxy'];
  
  console.log('   Checking environment variables:');
  let hasProxy = false;
  
  proxyVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`   ${varName}: ${value}`);
      hasProxy = true;
    }
  });
  
  if (!hasProxy) {
    console.log('   ✅ No proxy configuration detected');
  } else {
    console.log('   ⚠️  Proxy configuration detected - this might affect API connectivity');
  }
}

// Run the diagnosis
diagnoseGeminiNetwork().catch(console.error);