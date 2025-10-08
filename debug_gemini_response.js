import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyApDWgDSJ_tohn9ufNlPLV8Z35eyganK6s');

const testPrompt = `You are a scientific report assistant. Generate a structured lab report draft based on the provided manual excerpt and student results.

Input Data:
Manual Excerpt:
Experiment: Determination of the Acceleration Due to Gravity Using a Simple Pendulum

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

The graph of T² versus L is a straight line passing through the origin, confirming the theoretical relationship.

Student Results/Observations:
Graph Analysis:
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
The experimental value of g = 9.82 m/s² is in excellent agreement with the accepted value of 9.81 m/s², with only 0.1% difference. The simple pendulum method proves to be accurate for determining gravitational acceleration.

Return only valid JSON with these sections:
- title: A concise, descriptive title
- introduction: Background and context
- objectives: Clear learning objectives  
- materials: Equipment and materials used
- procedures: Step-by-step methodology
- results: Findings and observations
- discussion: Analysis and interpretation
- conclusion: Key findings summary
- references: Citations and sources

Keep content concise, scientific, and appropriate for academic level.`;

async function debugGeminiResponse() {
  console.log('🔍 Debugging Gemini API response format...');
  console.log('='.repeat(60));
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 2048,
      }
    });
    
    console.log('🤖 Calling Gemini API...');
    const startTime = Date.now();
    
    const result = await model.generateContent(testPrompt);
    
    const responseTime = Date.now() - startTime;
    console.log(`⏱️  Response time: ${responseTime}ms`);
    
    console.log('\n📊 Response Structure:');
    console.log('-'.repeat(40));
    console.log('Full response object keys:', Object.keys(result));
    console.log('Response type:', typeof result);
    
    if (result.response) {
      console.log('\n📝 Response.response structure:');
      console.log('Response.response keys:', Object.keys(result.response));
      console.log('Response.response type:', typeof result.response);
      
      if (result.response.candidates) {
        console.log(`Found ${result.response.candidates.length} candidates`);
        
        if (result.response.candidates.length > 0) {
          const candidate = result.response.candidates[0];
          console.log('\n🔍 First candidate structure:');
          console.log('Candidate keys:', Object.keys(candidate));
          console.log('Finish reason:', candidate.finishReason);
          
          if (candidate.content && candidate.content.parts) {
            console.log(`Found ${candidate.content.parts.length} parts`);
            
            candidate.content.parts.forEach((part, index) => {
              console.log(`\nPart ${index}:`);
              console.log('Part keys:', Object.keys(part));
              console.log('Part type:', typeof part);
              
              if (part.text) {
                console.log('Text content preview:');
                console.log('First 200 chars:', part.text.substring(0, 200));
                console.log('Last 200 chars:', part.text.substring(Math.max(0, part.text.length - 200)));
                console.log(`Total text length: ${part.text.length}`);
                
                // Check for JSON-like content
                const jsonMatch = part.text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  console.log('\n✅ Found JSON-like content!');
                  console.log('JSON match length:', jsonMatch[0].length);
                  console.log('JSON match preview:', jsonMatch[0].substring(0, 300));
                } else {
                  console.log('\n❌ No JSON-like content found');
                }
              }
            });
          }
        }
      }
    }
    
    // Try to extract text using our current method
    console.log('\n🔧 Testing text extraction:');
    try {
      const extractedText = extractTextFromResponse(result);
      console.log('✅ Text extraction successful');
      console.log('Extracted text length:', extractedText.length);
      console.log('First 200 chars:', extractedText.substring(0, 200));
      console.log('Last 200 chars:', extractedText.substring(Math.max(0, extractedText.length - 200)));
    } catch (error) {
      console.log('❌ Text extraction failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Gemini API call failed:', error.message);
    console.error('Error stack:', error.stack);
  }
}

function extractTextFromResponse(result) {
  if (!result || !result.response) {
    throw new Error('Invalid response structure');
  }
  
  const response = result.response;
  
  if (!response.candidates || !Array.isArray(response.candidates)) {
    throw new Error('Missing or invalid candidates array');
  }
  
  if (response.candidates.length === 0) {
    throw new Error('Empty candidates array');
  }
  
  const candidate = response.candidates[0];
  
  if (candidate.finishReason === 'SAFETY') {
    throw new Error('Content blocked by safety filters');
  }
  
  if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts)) {
    throw new Error('Invalid content structure');
  }
  
  if (candidate.content.parts.length === 0) {
    throw new Error('Empty parts array');
  }
  
  const textPart = candidate.content.parts[0];
  
  if (!textPart.text || typeof textPart.text !== 'string') {
    throw new Error('Invalid text content');
  }
  
  return textPart.text.trim();
}

// Run debug
debugGeminiResponse().then(() => {
  console.log('\n✅ Debug completed!');
}).catch(error => {
  console.error('❌ Debug failed:', error);
});