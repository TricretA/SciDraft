import { generateDraftEnhanced } from './api/generate-draft-enhanced.js';

// Test data that mimics a typical request
const testRequest = {
  parsedText: `Aim: To determine the acceleration due to gravity using a simple pendulum.

Apparatus: Pendulum bob, string, stopwatch, meter rule, clamp stand.

Procedure: 
1. Set up the pendulum with a length of 50cm
2. Time 20 oscillations for different lengths
3. Calculate the period for each length
4. Plot T² vs L and determine g from the gradient

Observations:
- Length 50cm: 20 oscillations = 28.4s
- Length 40cm: 20 oscillations = 25.2s  
- Length 30cm: 20 oscillations = 22.1s`,
  
  results: `Length (cm) | Time for 20 oscillations (s) | Period T (s) | T² (s²)
50 | 28.4 | 1.42 | 2.02
40 | 25.2 | 1.26 | 1.59
30 | 22.1 | 1.11 | 1.23

Graph of T² vs L shows a linear relationship. Gradient = 4.02 s²/m
Using g = 4π²/gradient = 4π²/4.02 = 9.83 m/s²`,
  
  images: [],
  sessionId: '12345678-1234-1234-1234-123456789abc'
};

async function testEnhancedDraft() {
  console.log('=== Testing Enhanced Draft Generation ===\n');
  
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting test with sample data...');
    console.log(`📄 Parsed text length: ${testRequest.parsedText.length}`);
    console.log(`🔬 Results length: ${testRequest.results.length}`);
    console.log(`🖼️  Images: ${testRequest.images.length}`);
    
    const result = await generateDraftEnhanced({ aiData: testRequest });
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log(`\n⏱️  Total processing time: ${totalTime}ms`);
    
    if (result.success) {
      console.log('✅ Draft generation successful!');
      console.log(`📊 Metadata:`, result.metadata);
      console.log(`📝 Draft title: ${result.draft.title}`);
      console.log(`📄 Draft sections:`, Object.keys(result.draft));
      
      // Show a preview of each section
      console.log('\n📋 Draft Preview:');
      Object.entries(result.draft).forEach(([section, content]) => {
        const preview = content.substring(0, 150);
        console.log(`${section}: ${preview}${content.length > 150 ? '...' : ''}`);
      });
      
    } else {
      console.error('❌ Draft generation failed:', result.error);
      console.error('💡 Suggestions:', result.suggestions);
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the test
testEnhancedDraft().catch(console.error);