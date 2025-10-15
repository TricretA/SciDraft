import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import express from 'express';
import { createClient } from '@supabase/supabase-js';

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

// Enhanced timeout and retry configuration
const GEMINI_CONFIG = {
  TIMEOUT_MS: 60000, // 60 seconds for complex requests
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 2000,
  MODEL_NAME: 'gemini-2.5-flash',
  GENERATION_CONFIG: {
    temperature: 0.2,
    topP: 0.8,
    maxOutputTokens: 4096,
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

// Enhanced Gemini API call with retry logic and better timeout handling
async function callGeminiAPI(model, prompt, attempt = 1) {
  console.log(`🤖 Gemini API call attempt ${attempt}/${GEMINI_CONFIG.RETRY_ATTEMPTS}`);
  console.log(`⏱️  Timeout set to: ${GEMINI_CONFIG.TIMEOUT_MS}ms`);
  
  const startTime = Date.now();
  
  try {
    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        const elapsed = Date.now() - startTime;
        reject(new Error(`Gemini API call timed out after ${elapsed}ms`));
      }, GEMINI_CONFIG.TIMEOUT_MS);
    });
    
    // Create Gemini API promise with detailed logging
    const geminiPromise = model.generateContent(prompt)
      .then(result => {
        const elapsed = Date.now() - startTime;
        console.log(`✅ Gemini API responded in ${elapsed}ms`);
        return result;
      })
      .catch(error => {
        const elapsed = Date.now() - startTime;
        console.error(`❌ Gemini API failed after ${elapsed}ms:`, error.message);
        throw error;
      });
    
    // Race between timeout and API response
    const result = await Promise.race([geminiPromise, timeoutPromise]);
    
    // Validate response structure
    if (!result || !result.response) {
      throw new Error('Invalid response structure from Gemini API');
    }
    
    return result;
    
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`❌ Attempt ${attempt} failed after ${elapsed}ms:`, error.message);
    
    // Check if it's a timeout error and we have retries left
    if (error.message.includes('timeout') && attempt < GEMINI_CONFIG.RETRY_ATTEMPTS) {
      console.log(`🔄 Retrying in ${GEMINI_CONFIG.RETRY_DELAY_MS}ms...`);
      await new Promise(resolve => setTimeout(resolve, GEMINI_CONFIG.RETRY_DELAY_MS));
      return callGeminiAPI(model, prompt, attempt + 1);
    }
    
    // Enhanced error messages for different failure scenarios
    if (error.message.includes('timeout')) {
      throw new Error(`AI service timeout after ${elapsed}ms. The request took too long to process. Please try again with a shorter input or contact support if the issue persists.`);
    } else if (error.message.includes('quota')) {
      throw new Error('AI service quota exceeded. Please try again later or contact support.');
    } else if (error.message.includes('API key')) {
      throw new Error('AI service authentication failed. Please check the API configuration.');
    } else {
      throw new Error(`AI service error: ${error.message}`);
    }
  }
}

// Enhanced response validation and text extraction
function extractTextFromGeminiResponse(result) {
  console.log('🔍 Validating Gemini response structure...');
  
  try {
    // Comprehensive response structure validation
    if (!result) {
      throw new Error('Gemini API returned null result');
    }
    
    if (!result.response) {
      console.error('Response structure:', Object.keys(result));
      throw new Error('Missing response object in Gemini result');
    }
    
    if (!result.response.candidates || !Array.isArray(result.response.candidates)) {
      console.error('Response structure:', JSON.stringify(result.response, null, 2));
      throw new Error('Invalid or missing candidates array');
    }
    
    if (result.response.candidates.length === 0) {
      throw new Error('Empty candidates array');
    }
    
    const candidate = result.response.candidates[0];
    
    // Check for safety blocks
    if (candidate.finishReason === 'SAFETY') {
      console.error('Safety ratings:', candidate.safetyRatings);
      throw new Error('Content generation blocked by safety filters');
    }
    
    if (!candidate.content) {
      throw new Error('Missing content in candidate');
    }
    
    if (!candidate.content.parts || !Array.isArray(candidate.content.parts)) {
      throw new Error('Invalid or missing parts array');
    }
    
    if (candidate.content.parts.length === 0) {
      throw new Error('Empty parts array');
    }
    
    const textPart = candidate.content.parts[0];
    
    if (!textPart.text || typeof textPart.text !== 'string') {
      console.error('Text part structure:', textPart);
      throw new Error('Invalid or missing text content');
    }
    
    const generatedText = textPart.text.trim();
    
    if (generatedText.length === 0) {
      throw new Error('Empty text content');
    }
    
    console.log(`✅ Extracted ${generatedText.length} characters of text`);
    console.log(`📄 Response preview: ${generatedText.substring(0, 200)}...`);
    
    return generatedText;
    
  } catch (error) {
    console.error('Response validation failed:', error.message);
    console.error('Full response:', JSON.stringify(result, (key, value) => 
      typeof value === 'function' ? '[Function]' : value, 2));
    throw error;
  }
}

// Main enhanced draft generation function
export async function generateDraftEnhanced(requestBody) {
  console.log('🚀 Starting enhanced draft generation...');
  
  try {
    // Validate input
    const { parsedText, results, images, sessionId } = validateInput(requestBody);
    
    console.log(`📋 Input validated - Session: ${sessionId}`);
    console.log(`📝 Parsed text length: ${parsedText.length}`);
    console.log(`🔬 Results length: ${results.length}`);
    console.log(`🖼️  Images: ${images.length}`);
    
    // Load system prompt
    const systemPrompt = loadSystemPrompt();
    
    // Format user input
    const imageInfo = formatImagesForAI(images);
    const userInput = `Manual Excerpt:\n${parsedText}\n\nStudent Results/Observations:\n${results}${imageInfo}`;
    
    // Initialize model
    const model = genAI.getGenerativeModel({ 
      model: GEMINI_CONFIG.MODEL_NAME,
      generationConfig: GEMINI_CONFIG.GENERATION_CONFIG
    });
    
    // Create complete prompt
    const fullPrompt = `${systemPrompt}\n\nInput Data:\n${userInput}`;
    
    console.log(`📄 Full prompt length: ${fullPrompt.length} characters`);
    
    // Call Gemini API with enhanced retry logic
    const result = await callGeminiAPI(model, fullPrompt);
    
    // Extract and validate response text
    const generatedText = extractTextFromGeminiResponse(result);
    
    // Parse JSON response
    const draftData = parseGeminiResponse(generatedText);
    
    // Validate draft content
    validateDraftContent(draftData);
    
    console.log('✅ Draft generation completed successfully');
    
    return {
      success: true,
      draft: draftData,
      sessionId,
      metadata: {
        promptLength: fullPrompt.length,
        responseLength: generatedText.length,
        processingTime: Date.now() - startTime
      }
    };
    
  } catch (error) {
    console.error('❌ Draft generation failed:', error.message);
    
    return {
      success: false,
      error: error.message,
      errorType: 'gemini_api_error',
      suggestions: getErrorSuggestions(error.message)
    };
  }
}

// Helper function to format images for AI processing
function formatImagesForAI(images) {
  if (!images || images.length === 0) {
    return '';
  }
  
  return `\n\nUploaded Images (${images.length} files):\n` + 
    images.map((img, index) => `${index + 1}. ${img.name || `Image ${index + 1}`}`).join('\n');
}

// Enhanced JSON parsing with better error handling
function parseGeminiResponse(generatedText) {
  console.log('🔍 Parsing Gemini response JSON...');
  
  let draftData;
  let parseAttempt = 0;
  const maxParseAttempts = 4;
  
  while (parseAttempt < maxParseAttempts && !draftData) {
    parseAttempt++;
    console.log(`🔄 JSON parsing attempt ${parseAttempt}/${maxParseAttempts}`);
    
    try {
      let cleanedText = generatedText;
      
      switch (parseAttempt) {
        case 1:
          // Basic markdown cleanup
          cleanedText = generatedText
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .replace(/^[^{]*({.*})[^}]*$/s, '$1')
            .trim();
          break;
          
        case 2:
          // More aggressive cleaning
          cleanedText = generatedText
            .replace(/```[a-zA-Z]*\s*/gi, '')
            .replace(/^[\s\S]*?({[\s\S]*})[\s\S]*?$/g, '$1')
            .replace(/\n\s*\/\/.*$/gm, '')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .trim();
          break;
          
        case 3:
          // Find JSON boundaries
          const startIndex = generatedText.indexOf('{');
          const lastIndex = generatedText.lastIndexOf('}');
          if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
            cleanedText = generatedText.substring(startIndex, lastIndex + 1);
          }
          break;
          
        case 4:
          // JSON repair
          cleanedText = generatedText
            .replace(/```[a-zA-Z]*\s*/gi, '')
            .replace(/```\s*/g, '')
            .replace(/([{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
            .replace(/:\s*([^"\[\{][^,}\]]*[^,}\]\s])\s*([,}])/g, ':"$1"$2')
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']')
            .trim();
          
          const jsonMatch = cleanedText.match(/{[\s\S]*}/);
          if (jsonMatch) {
            cleanedText = jsonMatch[0];
          }
          break;
      }
      
      console.log(`Attempt ${parseAttempt} - Cleaned text length: ${cleanedText.length}`);
      
      try {
        draftData = JSON.parse(cleanedText);
        console.log(`✅ JSON parsed successfully on attempt ${parseAttempt}`);
        break;
      } catch (parseError) {
        console.log(`❌ Parse attempt ${parseAttempt} failed: ${parseError.message}`);
        if (parseAttempt === maxParseAttempts) {
          throw new Error(`Failed to parse JSON response after ${maxParseAttempts} attempts: ${parseError.message}`);
        }
      }
      
    } catch (error) {
      console.error(`Error in parsing attempt ${parseAttempt}:`, error.message);
      if (parseAttempt === maxParseAttempts) {
        throw error;
      }
    }
  }
  
  return draftData;
}

// Enhanced input validation
function validateInput(requestBody) {
  const data = requestBody.aiData || requestBody;
  const { parsedText, results, images, sessionId } = data;
  
  // Validate parsedText
  if (!parsedText || typeof parsedText !== 'string') {
    throw new Error('Parsed text must be a non-empty string');
  }
  if (parsedText.trim().length === 0) {
    throw new Error('Parsed text cannot be empty');
  }
  if (parsedText.length > 50000) {
    throw new Error('Parsed text exceeds maximum length of 50,000 characters');
  }
  
  // Validate results
  let processedResults = 'No results provided yet - draft will be generated based on available information';
  if (results && typeof results === 'string' && results.trim().length > 0) {
    if (results.length > 20000) {
      throw new Error('Results text exceeds maximum length of 20,000 characters');
    }
    processedResults = results.trim();
  }
  
  // Validate sessionId
  if (!sessionId || typeof sessionId !== 'string') {
    throw new Error('Session ID is required and must be a string');
  }
  if (!/^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/.test(sessionId.trim())) {
    throw new Error('Session ID must be a valid UUID format');
  }
  
  // Validate images
  let processedImages = [];
  if (images && Array.isArray(images)) {
    if (images.length > 10) {
      throw new Error('Maximum of 10 images allowed');
    }
    processedImages = images.filter(img => img && typeof img === 'object');
  }
  
  return {
    parsedText: parsedText.trim(),
    results: processedResults,
    images: processedImages,
    sessionId: sessionId.trim()
  };
}

// Enhanced draft content validation
function validateDraftContent(draftData) {
  console.log('🔍 Validating draft content...');
  
  if (!draftData || typeof draftData !== 'object') {
    throw new Error('Draft data must be a valid object');
  }
  
  const requiredSections = ['title', 'introduction', 'objectives', 'materials', 'procedures', 'results', 'discussion', 'conclusion', 'references'];
  const errors = [];
  
  for (const section of requiredSections) {
    const value = draftData[section];
    
    if (value === undefined || value === null) {
      errors.push(`Missing required section: ${section}`);
      continue;
    }
    
    if (typeof value !== 'string') {
      errors.push(`Section '${section}' must be a string`);
      continue;
    }
    
    if (value.trim().length === 0) {
      errors.push(`Section '${section}' cannot be empty`);
      continue;
    }
    
    if (value.length > 10000) {
      errors.push(`Section '${section}' exceeds maximum length`);
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Draft validation failed: ${errors.join('; ')}`);
  }
  
  console.log('✅ Draft content validation passed');
}

// Error suggestion helper
function getErrorSuggestions(errorMessage) {
  const suggestions = [];
  
  if (errorMessage.includes('timeout')) {
    suggestions.push('Try reducing the length of your input text');
    suggestions.push('Check your internet connection stability');
    suggestions.push('The AI service may be experiencing high load - try again in a few minutes');
  } else if (errorMessage.includes('quota')) {
    suggestions.push('The daily API quota may have been exceeded');
    suggestions.push('Try again later or contact support');
  } else if (errorMessage.includes('JSON')) {
    suggestions.push('The AI response format was unexpected');
    suggestions.push('Try rephrasing your input');
  } else {
    suggestions.push('Check your input format and try again');
    suggestions.push('Contact support if the issue persists');
  }
  
  return suggestions;
}

// Express route handler
const router = express.Router();

router.post('/generate-draft-enhanced', async (req, res) => {
  console.log('🎯 Received enhanced draft generation request');
  
  try {
    const result = await generateDraftEnhanced(req.body);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error in enhanced draft generation:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      errorType: 'server_error'
    });
  }
});

export default router;