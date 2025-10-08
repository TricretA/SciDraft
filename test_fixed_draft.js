import { generateDraftFixed } from './api/generate-draft-fix.js';

// Test data
const testData = {
  aiData: {
    parsedText: `Experiment: Determination of the Acceleration Due to Gravity Using a Simple Pendulum

Objective: To determine the acceleration due to gravity (g) by measuring the period of oscillation of a simple pendulum for different lengths and using the relationship T = 2π√(L/g).

Theory: For a simple pendulum with small amplitude oscillations, the period T is related to the length L and acceleration due to gravity g by the formula: T = 2π√(L/g). This can be rearranged to give: T² = (4π²/g)L. By plotting T² versus L, the slope of the graph will be 4π²/g, from which g can be calculated.

Apparatus: Simple pendulum setup, stopwatch, meter rule, bob, string, retort stand and clamp.

Procedure:
1. Set up the pendulum with the bob suspended from the retort stand.
2. Measure the length L of the pendulum from the point of suspension to the center of the bob.
3. Displace the pendulum through a small angle (<10°) and release it.
4. Time 20 complete oscillations using the stopwatch.
5. Calculate the period T by dividing the total time by 20.
6. Repeat steps 2-5 for 5 different lengths of the pendulum.

Results:
Length L (m) | Time for 20 oscillations (s) | Period T (s) | T² (s²)
0.20 | 17.8 | 0.89 | 0.79
0.30 | 21.9 | 1.095 | 1.20
0.40 | 25.3 | 1.265 | 1.60
0.50 | 28.2 | 1.41 | 1.99
0.60 | 31.0 | 1.55 | 2.40

The graph of T² versus L is a straight line passing through the origin, confirming the theoretical relationship.`,
    results: `Graph Analysis:
The graph of T² versus L yielded a straight line with slope = 4.02 s²/m.
Using the relationship: slope = 4π²/g
Therefore: g = 4π²/slope = 4π²/4.02 = 9.82 m/s²

Percentage error compared to standard value (9.81 m/s²):
Error = |9.82-9.81|/9.81 × 100% = 0.1%

Sources of Error:
1. Human reaction time in starting/stopping stopwatch
2. Air resistance affecting pendulum motion
3. Small angle approximation may not be perfectly maintained
4. Measurement uncertainties in length and time

Conclusion:
The experimental value of g = 9.82 m/s² is in excellent agreement with the accepted value of 9.81 m/s², with only 0.1% difference. The simple pendulum method proves to be accurate for determining gravitational acceleration.`,
    images: [
      { name: 'pendulum_setup.jpg', url: 'https://example.com/pendulum.jpg' },
      { name: 't2_vs_l_graph.png', url: 'https://example.com/graph.png' }
    ],
    sessionId: 'test-session-' + Date.now()
  }
};

// Test function
async function testFixedDraft() {
  console.log('🧪 Testing fixed draft generation...');
  console.log('='.repeat(50));
  
  const startTime = Date.now();
  
  try {
    const result = await generateDraftFixed(testData);
    
    const totalTime = Date.now() - startTime;
    
    console.log('\n📊 Test Results:');
    console.log('================');
    console.log(`⏱️  Total processing time: ${totalTime}ms`);
    console.log(`✅ Success: ${result.success}`);
    
    if (result.success) {
      console.log(`📝 Draft title: ${result.draft.title}`);
      console.log(`🔍 Method used: ${result.metadata.method}`);
      console.log(`📏 Response length: ${result.metadata.responseLength} characters`);
      
      console.log('\n📋 Draft sections:');
      console.log('-'.repeat(30));
      console.log(`📖 Introduction: ${result.draft.introduction.substring(0, 100)}...`);
      console.log(`🎯 Objectives: ${result.draft.objectives.substring(0, 100)}...`);
      console.log(`🧪 Materials: ${result.draft.materials.substring(0, 100)}...`);
      console.log(`⚙️  Procedures: ${result.draft.procedures.substring(0, 100)}...`);
      console.log(`📊 Results: ${result.draft.results.substring(0, 100)}...`);
      console.log(`💭 Discussion: ${result.draft.discussion.substring(0, 100)}...`);
      console.log(`🏁 Conclusion: ${result.draft.conclusion.substring(0, 100)}...`);
      console.log(`📚 References: ${result.draft.references.substring(0, 100)}...`);
      
    } else {
      console.log(`❌ Error: ${result.error}`);
      console.log(`🔍 Error type: ${result.errorType}`);
      console.log(`💡 Suggestions: ${result.suggestions.join(', ')}`);
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    console.error('📄 Stack trace:', error.stack);
  }
}

// Run test
console.log('🚀 Starting fixed draft generation test...');
testFixedDraft().then(() => {
  console.log('\n✅ Test completed!');
}).catch(error => {
  console.error('❌ Test failed:', error);
});