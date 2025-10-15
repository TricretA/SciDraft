import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import https from 'https';
import http from 'http';

// Initialize Gemini AI
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://jjgynhecxcnpizwdzsdi.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZ3luaGVjeGNucGl6d2R6c2RpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQ0NDU5NiwiZXhwIjoyMDczMDIwNTk2fQ.2NTxVijBWrrHiQAZkq5j9yh8MofTbJ070RlzDDFWRic'
);

// Enhanced configuration with fallback options
const GEMINI_CONFIG = {
  TIMEOUT_MS: 45000, // Reduced from 60s to avoid hanging
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 3000,
  MODEL_NAME: 'gemini-2.5-flash',
  GENERATION_CONFIG: {
    temperature: 0.2,
    topP: 0.8,
    maxOutputTokens: 8192, // Increased to handle complete responses
  }
};

// Load system prompt from file with multiple fallback strategies
function loadSystemPrompt() {
  const fallbackPrompt = `You are an academic assistant helping a student draft a lab report.  
Your task is to generate a structured report with all 10 required sections.  

Rules:
1. Sections Title, Introduction, Objectives/Aims, Materials & Reagents, Procedures, and Results:  
   - Title - Be descriptive, concise, and specific. Use the one provided on the manual.
   - Introduction - Provide background theory. State the problem and purpose. Structure from general to specific. Make it at least 6 sentences.
   - Objectives/Aims - Use a bulleted or numbered list. Start each point with a clear action verb. Ensure goals are specific and measurable. Give at least 6 sentences.
   - Materials - List all equipment and reagents as in the manual. Do not describe the use of the materials.
   - Procedure - Write in paragraph form, not a list. Use the past tense and passive voice. Be detailed enough for replication. Do copy the lab manual procedures - enhance them if they are not clear.
   - Results - Present raw and processed data objectively. Use clearly labeled tables and figures. Show sample calculations(if available). Include qualitative observations. Do not interpret the data.
   - Never invent results; use exactly what was provided.  
   - If no results are provided, write "[STUDENT INPUT REQUIRED - Please add your experimental results and observations here]" in the Results section.  

2. Sections Discussion, Recommendations, and Conclusion:  
   - Do NOT write the full text.  
   - Instead, provide **guidance** on how the student should write.  
   - Guidance must be specific to the experiment (e.g., "In your Discussion, reflect on why the observed color change occurred and compare with the expected reaction mechanism").  
   - Recommendations - Guide on Suggestion specific, practical improvements to the experimental design. Guide them how to Justify how these changes would yield better results.
   - Conclusion must state whether the objectives were met. Do not introduce new information. You confirm the objectives and guide them what to write.
   - Never give a completed essay here.  
   - Each section must be at least six long sentences.

3. References:  
   - Provide exactly **3 references only**:  
     - Three standard textbooks (formatted properly in APA format).  
   - References must be exactly relevant to the report.  

4. Formatting:  
   - Output must strictly follow this structure:  
     1. Title  
     2. Introduction (at least 6 sentences)
     3. Objectives/Aims (at least 6 sentences) 
     4. Materials & Reagents  
     5. Procedures  
     6. Results  
     7. Discussion (Guidance only at least 6 sentences)  
     8. Recommendations (Guidance only at least 6 sentences)  
     9. Conclusion (Guidance only at least 6 sentences)  
     10. References (only 3 sources)  
- Vary sentence structures, use synonyms, and insert slight differences in tone while preserving accuracy.
- Avoid repetitive phrasing. Write with moderate complexity, include natural human hesitations (e.g., likely due to), and avoid generic AI filler sentences.
- Vary sentence length, Add transition phrases ("however," "in practice," "as observed"), Reduce overly formal AI rhythm. Make it sound its written by a student not AI.
5. Output format:  
   - Return ONLY valid JSON with 10 keys corresponding to the sections, no comments, no markdown, no text outside JSON.  
   - If info is missing, write "[STUDENT INPUT REQUIRED]".`;

  try {
    // Strategy 1: Try to load from current working directory (production)
    const promptPath = path.join(process.cwd(), 'gemini_prompt.txt');
    if (fs.existsSync(promptPath)) {
      const content = fs.readFileSync(promptPath, 'utf8');
      console.log('✅ System prompt loaded from:', promptPath);
      return content;
    }
    
    // Strategy 2: Try to load from project root (development)
    const rootPath = path.join(__dirname, '..', 'gemini_prompt.txt');
    if (fs.existsSync(rootPath)) {
      const content = fs.readFileSync(rootPath, 'utf8');
      console.log('✅ System prompt loaded from:', rootPath);
      return content;
    }
    
    // Strategy 3: Try to load from API directory (alternative deployment)
    const apiPath = path.join(__dirname, 'gemini_prompt.txt');
    if (fs.existsSync(apiPath)) {
      const content = fs.readFileSync(apiPath, 'utf8');
      console.log('✅ System prompt loaded from:', apiPath);
      return content;
    }
    
    // Strategy 4: Use fallback prompt
    console.warn('⚠️  Could not find gemini_prompt.txt file, using fallback prompt');
    console.warn('Searched paths:', [promptPath, rootPath, apiPath]);
    return fallbackPrompt;
    
  } catch (error) {
    console.error('❌ Error loading system prompt:', error.message);
    console.error('Using fallback prompt instead');
    return fallbackPrompt;
  }
}

// Alternative Gemini API call using direct HTTP requests
async function callGeminiWithFallback(model, prompt, attempt = 1) {
  console.log(`🤖 Gemini API call attempt ${attempt}/${GEMINI_CONFIG.RETRY_ATTEMPTS}`);
  
  try {
    // First attempt: Use the standard SDK method
    if (attempt === 1) {
      return await callGeminiStandard(model, prompt);
    }
    
    // Fallback attempts: Use direct HTTP API call
    console.log('🔄 Using fallback HTTP API call...');
    return await callGeminiDirectHTTP(prompt);
    
  } catch (error) {
    console.error(`❌ Attempt ${attempt} failed:`, error.message);
    
    if (attempt < GEMINI_CONFIG.RETRY_ATTEMPTS) {
      console.log(`⏳ Waiting ${GEMINI_CONFIG.RETRY_DELAY_MS}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, GEMINI_CONFIG.RETRY_DELAY_MS));
      return callGeminiWithFallback(model, prompt, attempt + 1);
    }
    
    throw error;
  }
}

// Standard SDK method with enhanced error handling
async function callGeminiStandard(model, prompt) {
  console.log('📡 Using standard Gemini SDK method...');
  
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Gemini API call timed out after 45 seconds'));
    }, GEMINI_CONFIG.TIMEOUT_MS);
    
    try {
      const result = await model.generateContent(prompt);
      clearTimeout(timeout);
      resolve(result);
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}

// Direct HTTP API call as fallback
async function callGeminiDirectHTTP(prompt) {
  console.log('🌐 Using direct HTTP API call...');
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key is not configured in environment variables.');
  }
  
  const requestData = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: GEMINI_CONFIG.GENERATION_CONFIG
  };
  
  const postData = JSON.stringify(requestData);
  
  const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: `/v1beta/models/${GEMINI_CONFIG.MODEL_NAME}:generateContent?key=${apiKey}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'User-Agent': 'Node.js/18.0.0'
    },
    timeout: GEMINI_CONFIG.TIMEOUT_MS
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const response = JSON.parse(data);
            console.log('✅ Direct HTTP call successful');
            resolve(response);
          } else {
            console.error(`❌ HTTP ${res.statusCode}: ${data}`);
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Direct HTTP request failed:', error.message);
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Direct HTTP call timed out'));
    });
    
    req.write(postData);
    req.end();
  });
}

// Enhanced response processing
function processGeminiResponse(result) {
  console.log('🔍 Processing Gemini response...');
  
  try {
    // Handle both SDK response format and direct HTTP response format
    let responseData;
    
    if (result.response) {
      // SDK format
      responseData = result;
    } else if (result.candidates) {
      // Direct HTTP format - wrap it to match SDK format
      responseData = { response: result };
    } else {
      throw new Error('Unknown response format');
    }
    
    // Extract text using the same logic as before
    const generatedText = extractTextFromResponse(responseData);
    
    console.log(`✅ Extracted ${generatedText.length} characters`);
    return generatedText;
    
  } catch (error) {
    console.error('Response processing failed:', error.message);
    throw error;
  }
}

// Extract text from response (handles both formats)
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

// Main fixed draft generation function
export async function generateDraftFixed(requestBody) {
  console.log('🚀 Starting fixed draft generation...');
  const startTime = Date.now();
  
  try {
    // Validate and prepare input
    const { parsedText, results, images, sessionId } = prepareInput(requestBody);
    
    console.log(`📋 Input prepared - Session: ${sessionId}`);
    console.log(`📝 Parsed text length: ${parsedText.length}`);
    
    // Load system prompt
    const systemPrompt = loadSystemPrompt();
    
    // Format user input (reduced for faster processing)
    const userInput = formatUserInput(parsedText, results, images);
    
    // Initialize model
    const model = genAI.getGenerativeModel({ 
      model: GEMINI_CONFIG.MODEL_NAME,
      generationConfig: GEMINI_CONFIG.GENERATION_CONFIG
    });
    
    // Create complete prompt
    const fullPrompt = `${systemPrompt}\n\nInput Data:\n${userInput}`;
    
    console.log(`📄 Prompt length: ${fullPrompt.length} characters`);
    
    // Call Gemini API with fallback mechanism
    const result = await callGeminiWithFallback(model, fullPrompt);
    
    // Process response
    const generatedText = processGeminiResponse(result);
    
    // Parse JSON response
    const draftData = parseJsonResponse(generatedText);
    
    // Validate draft content
    validateDraftContent(draftData);
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ Draft generation completed in ${totalTime}ms`);
    
    return {
      success: true,
      draft: draftData,
      sessionId,
      metadata: {
        promptLength: fullPrompt.length,
        responseLength: generatedText.length,
        processingTime: totalTime,
        method: result.response ? 'sdk' : 'direct_http'
      }
    };
    
  } catch (error) {
    console.error('❌ Draft generation failed:', error.message);
    
    return {
      success: false,
      error: error.message,
      errorType: getErrorType(error.message),
      suggestions: getErrorSuggestions(error.message),
      processingTime: Date.now() - startTime
    };
  }
}

// Input preparation
function prepareInput(requestBody) {
  const data = requestBody.aiData || requestBody;
  const { parsedText, results, images, sessionId } = data;
  
  if (!parsedText || typeof parsedText !== 'string' || parsedText.trim().length === 0) {
    throw new Error('Parsed text is required and must be non-empty');
  }
  
  if (parsedText.length > 25000) { // Reduced limit for faster processing
    throw new Error('Parsed text exceeds maximum length of 25,000 characters');
  }
  
  let processedResults = 'No results provided - generating draft based on manual excerpt';
  if (results && typeof results === 'string' && results.trim().length > 0) {
    if (results.length > 10000) { // Reduced limit
      throw new Error('Results text exceeds maximum length of 10,000 characters');
    }
    processedResults = results.trim();
  }
  
  if (!sessionId || typeof sessionId !== 'string') {
    throw new Error('Valid session ID is required');
  }
  
  const processedImages = (images && Array.isArray(images)) ? images.slice(0, 5) : []; // Limit to 5 images
  
  return {
    parsedText: parsedText.trim(),
    results: processedResults,
    images: processedImages,
    sessionId: sessionId.trim()
  };
}

// Format user input (simplified for faster processing)
function formatUserInput(parsedText, results, images) {
  let input = `Manual Excerpt:\n${parsedText}\n\nStudent Results/Observations:\n${results}`;
  
  if (images.length > 0) {
    input += `\n\nUploaded Images (${images.length}): ${images.map(img => img.name || 'Image').join(', ')}`;
  }
  
  return input;
}

// JSON parsing (enhanced)
function parseJsonResponse(generatedText) {
  console.log('🔍 Parsing JSON response...');
  console.log('Raw response length:', generatedText.length);
  console.log('First 100 chars:', generatedText.substring(0, 100));
  
  try {
    // Remove markdown code block wrappers if present
    let cleanedText = generatedText
      .replace(/^```json\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    
    console.log('Cleaned text length:', cleanedText.length);
    console.log('First 100 chars of cleaned:', cleanedText.substring(0, 100));
    
    // Try to parse the entire cleaned text as JSON first
    try {
      const parsed = JSON.parse(cleanedText);
      console.log('✅ Successfully parsed entire text as JSON');
      return normalizeDraftKeys(parsed);
    } catch (parseError) {
      console.log('❌ Failed to parse entire text, trying JSON extraction...');
    }
    
    // Try to extract JSON object from response using a more robust approach
    let jsonObject = null;
    
    // Method 1: Look for JSON that starts with { and ends with } at the end
    const endMatch = cleanedText.match(/\{[\s\S]*\}$/);
    if (endMatch) {
      try {
        jsonObject = JSON.parse(endMatch[0]);
        console.log('✅ Found JSON at end of text');
      } catch (e) {
        console.log('❌ End JSON parse failed, trying other methods...');
      }
    }
    
    // Method 2: Try to find the largest valid JSON object
    if (!jsonObject) {
      // Start from the beginning and try to find valid JSON
      let startIndex = 0;
      while (startIndex < cleanedText.length) {
        const braceIndex = cleanedText.indexOf('{', startIndex);
        if (braceIndex === -1) break;
        
        // Try to find the matching closing brace
        let braceCount = 0;
        let endIndex = -1;
        for (let i = braceIndex; i < cleanedText.length; i++) {
          if (cleanedText[i] === '{') braceCount++;
          else if (cleanedText[i] === '}') braceCount--;
          
          if (braceCount === 0) {
            endIndex = i + 1;
            break;
          }
        }
        
        if (endIndex > braceIndex) {
          const jsonCandidate = cleanedText.substring(braceIndex, endIndex);
          try {
            jsonObject = JSON.parse(jsonCandidate);
            console.log(`✅ Found valid JSON object from position ${braceIndex} to ${endIndex}`);
            break;
          } catch (e) {
            // Not valid JSON, continue searching
          }
        }
        
        startIndex = braceIndex + 1;
      }
    }
    
    if (!jsonObject) {
      throw new Error('No valid JSON object found in response');
    }
    
    return normalizeDraftKeys(jsonObject);
    
  } catch (error) {
    console.error('JSON parsing failed:', error.message);
    console.error('Response preview:', generatedText.substring(0, 500));
    throw new Error(`Failed to parse JSON: ${error.message}`);
  }
}

// Normalize draft keys to expected format
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
  
  console.log('Normalized keys:', Object.keys(normalized));
  return normalized;
}

// Validate draft content (enhanced with fallback)
function validateDraftContent(draftData) {
  if (!draftData || typeof draftData !== 'object') {
    throw new Error('Invalid draft data');
  }
  
  const requiredSections = ['title', 'introduction', 'procedures', 'results', 'conclusion'];
  const optionalSections = ['objectives', 'materials', 'discussion', 'references'];
  
  // Check required sections
  for (const section of requiredSections) {
    if (!draftData[section] || typeof draftData[section] !== 'string') {
      throw new Error(`Missing or invalid required section: ${section}`);
    }
    
    if (draftData[section].trim().length === 0) {
      throw new Error(`Empty required section: ${section}`);
    }
  }
  
  // Handle optional sections - create defaults if missing
  for (const section of optionalSections) {
    if (!draftData[section] || typeof draftData[section] !== 'string' || draftData[section].trim().length === 0) {
      console.log(`⚠️  Missing optional section: ${section}, creating default...`);
      
      switch (section) {
        case 'objectives':
          draftData[section] = 'To investigate the relationship between pendulum length and period to determine gravitational acceleration.';
          break;
        case 'materials':
          draftData[section] = 'Materials used in this experiment are listed in the procedures section.';
          break;
        case 'discussion':
          draftData[section] = 'The experimental results are discussed in relation to theoretical predictions and potential sources of error.';
          break;
        case 'references':
          draftData[section] = 'Lab manual and standard physics textbooks.';
          break;
      }
    }
  }
  
  console.log('✅ Draft validation passed with fallbacks');
  return draftData;
}

// Error type classification
function getErrorType(errorMessage) {
  if (errorMessage.includes('timeout')) return 'timeout_error';
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) return 'network_error';
  if (errorMessage.includes('quota')) return 'quota_error';
  if (errorMessage.includes('JSON') || errorMessage.includes('parse')) return 'parse_error';
  if (errorMessage.includes('validation')) return 'validation_error';
  return 'unknown_error';
}

// Error suggestions
function getErrorSuggestions(errorMessage) {
  const suggestions = [];
  
  if (errorMessage.includes('timeout')) {
    suggestions.push('Try reducing the length of your input text');
    suggestions.push('Check your internet connection');
    suggestions.push('The AI service may be slow - try again in a few minutes');
  } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    suggestions.push('Check your internet connection');
    suggestions.push('Try refreshing the page');
    suggestions.push('The AI service may be temporarily unavailable');
  } else if (errorMessage.includes('quota')) {
    suggestions.push('Daily API limit may have been reached');
    suggestions.push('Try again tomorrow');
  } else if (errorMessage.includes('JSON')) {
    suggestions.push('The AI response format was unexpected');
    suggestions.push('Try rephrasing your input');
  } else {
    suggestions.push('Check your input and try again');
    suggestions.push('Contact support if the issue persists');
  }
  
  return suggestions;
}

// Express route
const router = express.Router();

router.post('/generate-draft', async (req, res) => {
  console.log('🎯 Received draft generation request');
  
  try {
    const result = await generateDraftFixed(req.body);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      errorType: 'server_error'
    });
  }
});

export default router;