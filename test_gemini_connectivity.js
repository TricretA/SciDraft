import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testGeminiConnectivity() {
  console.log('=== Gemini API Connectivity Test ===\n');
  
  // Check API key
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('1. Checking API key...');
  console.log(`   API Key present: ${!!apiKey}`);
  console.log(`   API Key length: ${apiKey?.length || 0}`);
  console.log(`   API Key preview: ${apiKey?.substring(0, 10)}...${apiKey?.substring(apiKey.length - 4)}`);
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY is not set in environment variables');
    return;
  }
  
  // Test basic initialization
  console.log('\n2. Testing Gemini AI initialization...');
  let genAI;
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('✅ Gemini AI initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Gemini AI:', error.message);
    return;
  }
  
  // Test model access
  console.log('\n3. Testing model access...');
  let model;
  try {
    model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 4096,
      }
    });
    console.log('✅ Model "gemini-2.5-flash" accessed successfully');
  } catch (error) {
    console.error('❌ Failed to access model:', error.message);
    return;
  }
  
  // Test simple API call with timeout
  console.log('\n4. Testing simple API call (10 second timeout)...');
  const startTime = Date.now();
  
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Test timeout after 10 seconds')), 10000);
    });
    
    const geminiPromise = model.generateContent('Hello, this is a connectivity test. Please respond with "Test successful".');
    
    const result = await Promise.race([geminiPromise, timeoutPromise]);
    const endTime = Date.now();
    
    console.log(`✅ API call completed in ${endTime - startTime}ms`);
    
    // Extract response text
    const responseText = result.response.candidates[0].content.parts[0].text;
    console.log(`✅ Response received: "${responseText.trim()}"`);
    
  } catch (error) {
    const endTime = Date.now();
    console.error(`❌ API call failed after ${endTime - startTime}ms:`, error.message);
    
    // Detailed error analysis
    if (error.message.includes('timeout')) {
      console.error('   → Timeout issue detected');
      console.error('   → Possible causes:');
      console.error('     - Network connectivity issues');
      console.error('     - High API server load');
      console.error('     - Rate limiting');
      console.error('     - Regional API endpoint issues');
    } else if (error.message.includes('API key')) {
      console.error('   → Authentication issue detected');
      console.error('   → Check if API key is valid and has proper permissions');
    } else if (error.message.includes('quota')) {
      console.error('   → Quota limit exceeded');
      console.error('   → Check your Google AI Studio quota settings');
    } else {
      console.error('   → Unknown error type');
      console.error('   → Full error details:', error);
    }
  }
  
  // Test network connectivity to Google APIs
  console.log('\n5. Testing network connectivity to Google APIs...');
  try {
    const https = await import('https');
    const testPromise = new Promise((resolve, reject) => {
      const req = https.get('https://generativelanguage.googleapis.com', (res) => {
        resolve({ statusCode: res.statusCode, statusMessage: res.statusMessage });
      });
      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Network test timeout'));
      });
    });
    
    const result = await testPromise;
    console.log(`✅ Google APIs reachable - Status: ${result.statusCode} ${result.statusMessage}`);
    
  } catch (networkError) {
    console.error('❌ Network connectivity issue:', networkError.message);
    console.error('   → Check your internet connection');
    console.error('   → Check firewall/proxy settings');
    console.error('   → Check if Google APIs are accessible from your location');
  }
  
  console.log('\n=== Test Summary ===');
  console.log('If all tests pass but you still experience timeouts in production:');
  console.log('1. Increase timeout from 30s to 60s for complex requests');
  console.log('2. Implement retry logic with exponential backoff');
  console.log('3. Check if the issue is specific to certain prompt types');
  console.log('4. Monitor API quota usage in Google AI Studio');
  console.log('5. Consider using a different model if gemini-2.5-flash is overloaded');
}

// Run the test
testGeminiConnectivity().catch(console.error);