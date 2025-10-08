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

async function debugFullResponse() {
  console.log('🔍 Debugging full Gemini response...');
  console.log('='.repeat(60));
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 4096, // Increased limit
      }
    });
    
    console.log('🤖 Calling Gemini API with increased token limit...');
    const result = await model.generateContent(testPrompt);
    
    console.log('\n📊 Response Metadata:');
    console.log('-'.repeat(40));
    console.log('Response keys:', Object.keys(result.response));
    console.log('Usage metadata:', result.response.usageMetadata);
    
    const generatedText = extractTextFromResponse(result);
    console.log('\n📄 Generated text:');
    console.log('Length:', generatedText.length);
    console.log('Full text:');
    console.log('--- START OF RESPONSE ---');
    console.log(generatedText);
    console.log('--- END OF RESPONSE ---');
    
    // Check if response is complete
    console.log('\n🔍 Checking response completeness:');
    const endsWithClosingBrace = generatedText.trim().endsWith('}');
    const hasAllSections = generatedText.includes('"title"') && 
                          generatedText.includes('"introduction"') &&
                          generatedText.includes('"conclusion"');
    
    console.log('Ends with closing brace:', endsWithClosingBrace);
    console.log('Has all required sections:', hasAllSections);
    
    // Try to parse JSON
    console.log('\n🔧 Attempting JSON parsing:');
    try {
      const cleanedText = generatedText
        .replace(/^```json\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      
      const parsed = JSON.parse(cleanedText);
      console.log('✅ JSON parsing successful!');
      console.log('Parsed keys:', Object.keys(parsed));
      
      // Show normalized version
      const normalized = normalizeDraftKeys(parsed);
      console.log('Normalized keys:', Object.keys(normalized));
      
    } catch (error) {
      console.log('❌ JSON parsing failed:', error.message);
      
      // Try to find where the JSON breaks
      console.log('\n🔍 Finding JSON break point:');
      let braceCount = 0;
      let lastValidPos = -1;
      
      for (let i = 0; i < cleanedText.length; i++) {
        if (cleanedText[i] === '{') braceCount++;
        else if (cleanedText[i] === '}') braceCount--;
        
        if (braceCount === 0) {
          lastValidPos = i + 1;
        }
      }
      
      console.log('Last valid position:', lastValidPos);
      console.log('Total length:', cleanedText.length);
      console.log('Missing characters:', cleanedText.length - lastValidPos);
      
      if (lastValidPos > 0) {
        const partialJson = cleanedText.substring(0, lastValidPos);
        console.log('\nTrying partial JSON:');
        console.log('Partial JSON length:', partialJson.length);
        
        try {
          const partialParsed = JSON.parse(partialJson);
          console.log('✅ Partial JSON parsing successful!');
          console.log('Partial keys:', Object.keys(partialParsed));
        } catch (e) {
          console.log('❌ Even partial JSON failed:', e.message);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Gemini API call failed:', error.message);
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

function normalizeDraftKeys(draftData) {
  const keyMapping = {
    'Title': 'title',
    'Introduction': 'introduction', 
    'Objectives': 'objectives',
    'Materials': 'materials',
    'Procedures': 'procedures',
    'Results': 'results',
    'Discussion': 'discussion',
    'Conclusion': 'conclusion',
    'References': 'references'
  };
  
  const normalized = {};
  
  for (const [oldKey, newKey] of Object.entries(keyMapping)) {
    if (draftData[oldKey]) {
      normalized[newKey] = draftData[oldKey];
    } else if (draftData[newKey]) {
      normalized[newKey] = draftData[newKey];
    }
  }
  
  // Handle case where keys might be lowercase but we need to map them
  const requiredSections = ['title', 'introduction', 'objectives', 'materials', 'procedures', 'results', 'discussion', 'conclusion', 'references'];
  
  for (const section of requiredSections) {
    if (!normalized[section]) {
      // Try to find the content in other keys
      for (const [key, value] of Object.entries(draftData)) {
        if (key.toLowerCase() === section.toLowerCase()) {
          normalized[section] = value;
          break;
        }
      }
    }
  }
  
  return normalized;
}

// Run debug
debugFullResponse().then(() => {
  console.log('\n✅ Debug completed!');
}).catch(error => {
  console.error('❌ Debug failed:', error);
});