import { GoogleGenerativeAI } from '@google/generative-ai';

// Test Gemini API connectivity
async function testGeminiAPI() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY not found in environment variables');
      return;
    }

    console.log('🔑 Testing Gemini API with key:', apiKey.substring(0, 10) + '...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Test different model names
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    
    for (const modelName of models) {
      try {
        console.log(`\n🤖 Testing model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent('Hello, this is a test.');
        const response = await result.response;
        const text = response.text();
        
        console.log(`✅ Model ${modelName} works! Response:`, text.substring(0, 50) + '...');
        break; // Stop if we find a working model
      } catch (modelError) {
        console.log(`❌ Model ${modelName} failed:`, modelError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Gemini API test failed:', error.message);
    console.error('Full error:', error);
  }
}

testGeminiAPI();