// Test script for original generate-draft.js endpoint

// Test data matching the working test
const testData = {
  parsedText: "Lab Manual: Determination of the Acceleration Due to Gravity Using a Simple Pendulum\n\nAim: To determine the acceleration due to gravity (g) using a simple pendulum.\n\nTheory: For a simple pendulum with small amplitude oscillations, the period T is related to the length L and acceleration due to gravity g by the formula: T = 2π√(L/g). Rearranging gives g = 4π²L/T².\n\nApparatus: Simple pendulum setup, stopwatch, meter scale, bob, string.\n\nProcedure: 1. Set up the pendulum with different lengths (20-100 cm). 2. Measure time for 20 oscillations. 3. Calculate period T = t/20. 4. Plot T² vs L. 5. Determine g from slope.",
  results: "Length (cm): 20, 30, 40, 50, 60, 70, 80, 90, 100\nTime for 20 oscillations (s): 18.2, 22.1, 25.4, 28.3, 31.0, 33.5, 35.8, 38.0, 40.2\nPeriod T (s): 0.91, 1.105, 1.27, 1.415, 1.55, 1.675, 1.79, 1.90, 2.01\nT² (s²): 0.828, 1.221, 1.613, 2.002, 2.403, 2.806, 3.204, 3.610, 4.040\nSlope from T² vs L graph: 4.02 s²/m\nCalculated g = 4π²/slope = 9.82 m/s²",
  images: [],
  sessionId: "550e8400-e29b-41d4-a716-446655440000"
};

async function testOriginalDraft() {
  console.log('🚀 Testing original generate-draft.js endpoint...');
  
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout
    
    const response = await fetch('http://localhost:3001/api/generate-draft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    console.log(`✅ Response received in ${processingTime}ms`);
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    console.error(`❌ Test failed after ${processingTime}ms`);
    
    if (error.name === 'AbortError') {
      console.error('❌ Request timed out');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

// Run the test
testOriginalDraft().catch(console.error);