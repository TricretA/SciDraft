import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
// Removed NextResponse import - using Express response methods instead

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyApDWgDSJ_tohn9ufNlPLV8Z35eyganK6s');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://jjgynhecxcnpizwdzsdi.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZ3luaGVjeGNucGl6d2R6c2RpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQ0NDU5NiwiZXhwIjoyMDczMDIwNTk2fQ.2NTxVijBWrrHiQAZkq5j9yh8MofTbJ070RlzDDFWRic'
);

// Load system prompt from file
function loadSystemPrompt() {
  try {
    const promptPath = path.join(process.cwd(), 'Gemini_prompt.txt');
    return fs.readFileSync(promptPath, 'utf8');
  } catch (error) {
    console.error('Error loading system prompt:', error);
    throw new Error('Failed to load system prompt');
  }
}

// Enhanced validation with comprehensive edge case handling
function validateInput(requestBody) {
  // Handle both direct data and aiData wrapper
  const data = requestBody.aiData || requestBody;
  const { parsedText, results, images, sessionId } = data;
  
  // Validate parsedText with edge cases
  if (!parsedText) {
    throw new Error('Parsed text is required');
  }
  if (typeof parsedText !== 'string') {
    throw new Error(`Parsed text must be a string, received: ${typeof parsedText}`);
  }
  if (parsedText.trim().length === 0) {
    throw new Error('Parsed text cannot be empty or whitespace only');
  }
  if (parsedText.length > 50000) {
    throw new Error('Parsed text exceeds maximum length of 50,000 characters');
  }
  
  // Validate results with edge cases
  let processedResults;
  if (!results || typeof results !== 'string' || results.trim() === '') {
    processedResults = 'No results provided yet - draft will be generated based on available information';
  } else {
    if (results.length > 20000) {
      throw new Error('Results text exceeds maximum length of 20,000 characters');
    }
    processedResults = results;
  }
  
  // Validate sessionId with comprehensive checks
  if (!sessionId) {
    throw new Error('Session ID is required');
  }
  if (typeof sessionId !== 'string') {
    throw new Error(`Session ID must be a string, received: ${typeof sessionId}`);
  }
  if (sessionId.trim().length === 0) {
    throw new Error('Session ID cannot be empty or whitespace only');
  }
  if (!/^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/.test(sessionId.trim())) {
    throw new Error('Session ID must be a valid UUID format');
  }
  
  // Validate images array
  let processedImages = [];
  if (images !== undefined && images !== null) {
    if (!Array.isArray(images)) {
      throw new Error(`Images must be an array, received: ${typeof images}`);
    }
    if (images.length > 10) {
      throw new Error('Maximum of 10 images allowed');
    }
    processedImages = images.filter(img => img && typeof img === 'object');
  }
  
  return {
    parsedText: parsedText.trim(),
    results: processedResults.trim(),
    images: processedImages,
    sessionId: sessionId.trim()
  };
}

// Enhanced draft content validation function
function validateDraftContent(draftData) {
  console.log('Starting comprehensive draft content validation...');
  
  // Check if draftData exists and is an object
  if (!draftData) {
    throw new Error('Draft data is null or undefined');
  }
  if (typeof draftData !== 'object') {
    throw new Error(`Draft data must be an object, received: ${typeof draftData}`);
  }
  if (Array.isArray(draftData)) {
    throw new Error('Draft data cannot be an array');
  }
  
  // Check for circular references that would break JSON.stringify
  try {
    JSON.stringify(draftData);
  } catch (circularError) {
    throw new Error('Draft data contains circular references or non-serializable content');
  }
  
  const requiredSections = ['title', 'introduction', 'objectives', 'materials', 'procedures', 'results', 'discussion', 'conclusion', 'references'];
  const validationErrors = [];
  
  // Validate each required section
  for (const section of requiredSections) {
    const value = draftData[section];
    
    // Check if section exists
    if (value === undefined || value === null) {
      validationErrors.push(`Missing required section: ${section}`);
      continue;
    }
    
    // Check if section is a string
    if (typeof value !== 'string') {
      validationErrors.push(`Section '${section}' must be a string, received: ${typeof value}`);
      continue;
    }
    
    // Check if section is not empty (after trimming)
    if (value.trim().length === 0) {
      validationErrors.push(`Section '${section}' cannot be empty`);
      continue;
    }
    
    // Check for reasonable content length
    if (value.length > 10000) {
      validationErrors.push(`Section '${section}' exceeds maximum length of 10,000 characters`);
      continue;
    }
    
    // Check for suspicious content patterns
    if (value.includes('undefined') || value.includes('null') || value.includes('[object Object]')) {
      validationErrors.push(`Section '${section}' contains suspicious content patterns`);
    }
  }
  
  // Validate title specifically (most critical section)
  if (draftData.title) {
    const title = draftData.title.trim();
    if (title.length < 5) {
      validationErrors.push('Title is too short (minimum 5 characters)');
    }
    if (title.length > 200) {
      validationErrors.push('Title is too long (maximum 200 characters)');
    }
    if (/^[\[\(].*[\]\)]$/.test(title)) {
      validationErrors.push('Title appears to be a placeholder or error message');
    }
  }
  
  // Check for unexpected properties that might indicate parsing issues
  const allowedProperties = [...requiredSections, 'abstract', 'recommendations', 'error_note', 'metadata'];
  const unexpectedProps = Object.keys(draftData).filter(key => !allowedProperties.includes(key));
  if (unexpectedProps.length > 0) {
    console.warn('Draft contains unexpected properties:', unexpectedProps);
  }
  
  // Log validation results
  if (validationErrors.length > 0) {
    console.error('Draft content validation failed:', validationErrors);
    throw new Error(`Draft validation failed: ${validationErrors.join('; ')}`);
  }
  
  console.log('Draft content validation passed successfully');
  return true;
}

// Format images for AI processing
function formatImagesForAI(images) {
  if (!images || images.length === 0) {
    return '';
  }
  
  return `\n\nUploaded Images (${images.length} files):\n` + 
    images.map((img, index) => `${index + 1}. ${img.name || `Image ${index + 1}`}`).join('\n');
}

// Exponential backoff utility
async function exponentialBackoff(fn, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s, 8s, 16s
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms delay`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

const router = express.Router();

// Main draft generation function
async function handler(req, res) {
  // Set response headers to ensure proper JSON content type
  res.setHeader('Content-Type', 'application/json');
  
  // Comprehensive try-catch wrapper to ensure ALL errors return valid JSON
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      const errorResponse = JSON.stringify({
        success: false,
        error: 'Method not allowed'
      });
      return res.status(405).end(errorResponse);
    }
    // Validate input data
    const validatedData = validateInput(req.body);
    const { parsedText, results, images, sessionId } = validatedData;
    
    // Extract user_id from request body (optional for anonymous users)
    const { user_id } = req.body;
    
    // Use the provided user_id directly - no validation against auth.users
    // The auth.users table/view is not accessible with service role in standard Supabase setup
    // Frontend should only send valid user IDs from authenticated sessions
    let validUserId = user_id || null;
    
    console.log('Processing draft for user:', validUserId ? 'authenticated user' : 'anonymous user');
    console.log('User ID received:', validUserId);
    
    // Create initial draft record in database
    console.log('Creating initial draft record with session_id:', sessionId);
    console.log('Session ID:', sessionId);
    console.log('User ID:', validUserId);
    
    // Generate a UUID for session_id since the database expects UUID format
    // We'll use the sessionId as a reference but generate a proper UUID for the database
    let existingDraft;
    try {
      const { data, error: checkError } = await supabase
        .from('drafts')
        .select('id')
        .eq('session_id', sessionId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error checking existing draft:', checkError);
        console.error('Draft check error details:', {
          code: checkError.code,
          message: checkError.message,
          details: checkError.details,
          hint: checkError.hint
        });
        throw new Error('Failed to check existing draft record');
      }
      
      existingDraft = data;
    } catch (dbError) {
      console.error('Database error during draft check:', dbError);
      throw new Error('Database connection failed during draft check');
    }
    
    // If draft already exists, update it instead of creating new one
    if (existingDraft) {
      try {
        console.log('Updating existing draft record');
        const { error: updateError } = await supabase
          .from('drafts')
          .update({
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('session_id', sessionId);
          
        if (updateError) {
          console.error('Error updating existing draft record:', updateError);
          throw new Error('Failed to update draft record');
        }
        
        console.log('Updated existing draft status to generating');
      } catch (dbError) {
        console.error('Database error during draft update:', dbError);
        throw new Error('Database connection failed during draft update');
      }
    } else {
      try {
        // Create new draft record with generated UUID
        console.log('Creating new draft record');
        const { data: newDraft, error: insertError } = await supabase
          .from('drafts')
          .insert({
            session_id: sessionId, // This will be converted to UUID by Supabase if sessionId is valid UUID format
            user_id: validUserId, // Use validated user_id (can be null for anonymous drafts)
            status: 'processing',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (insertError) {
          console.error('Error creating initial draft record:', insertError);
          throw new Error('Failed to create draft record');
        }
        
        console.log('Created new draft record:', newDraft.id);
      } catch (dbError) {
        console.error('Database error during draft creation:', dbError);
        throw new Error('Database connection failed during draft creation');
      }
    }

    console.log('Draft record processed successfully');
    
    // Load the exact system prompt
    const systemPrompt = loadSystemPrompt();
    
    // Format the user input
    const imageInfo = formatImagesForAI(images);
    const userInput = `Manual Excerpt:\n${parsedText}\n\nStudent Results/Observations:\n${results}${imageInfo}`;
    
    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 4096,
      }
    });
    
    // Create the complete prompt
    const fullPrompt = `${systemPrompt}\n\nInput Data:\n${userInput}`;
    
    console.log('Sending request to Gemini AI...');
    
    // Generate content with comprehensive error handling and timeout
    let result;
    try {
      console.log('Calling Gemini API...');
      console.log('Full prompt length:', fullPrompt.length);
      console.log('Full prompt preview:', fullPrompt.substring(0, 300) + '...');
      
      // Set a timeout for the Gemini API call (30 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Gemini API call timed out after 30 seconds')), 30000);
      });
      
      const geminiPromise = model.generateContent(fullPrompt);
      
      result = await Promise.race([geminiPromise, timeoutPromise]);
      console.log('Gemini API call completed successfully');
    } catch (geminiError) {
      console.error('Gemini API call failed:', geminiError);
      if (geminiError.message.includes('timeout')) {
        throw new Error('AI service is currently unavailable (timeout). Please try again later.');
      }
      throw new Error(`Gemini API error: ${geminiError.message}`);
    }
    
    // Enhanced response validation and text extraction based on Gemini response structure analysis
    let generatedText;
    try {
      // Log the full response structure for debugging
      console.log('Gemini API response structure analysis:');
      console.log('- Response type:', typeof result);
      console.log('- Has response property:', !!result?.response);
      console.log('- Response keys:', result?.response ? Object.keys(result.response) : 'N/A');
      
      // Comprehensive validation of response structure
      if (!result) {
        throw new Error('Gemini API returned null or undefined result');
      }
      
      // Check if response follows the expected nested structure: result.response.candidates[0].content.parts[0].text
      if (!result.response) {
        console.error('Missing response object in Gemini result. Available keys:', Object.keys(result));
        throw new Error('Invalid Gemini response: missing response object');
      }
      
      if (!result.response.candidates || !Array.isArray(result.response.candidates)) {
        console.error('Missing or invalid candidates array. Response structure:', {
          hasCandidates: !!result.response.candidates,
          candidatesType: typeof result.response.candidates,
          responseKeys: Object.keys(result.response)
        });
        throw new Error('Invalid Gemini response: missing or invalid candidates array');
      }
      
      if (result.response.candidates.length === 0) {
        console.error('Empty candidates array in Gemini response');
        throw new Error('Invalid Gemini response: empty candidates array');
      }
      
      const candidate = result.response.candidates[0];
      console.log('Candidate structure:', {
        hasContent: !!candidate.content,
        finishReason: candidate.finishReason,
        candidateKeys: Object.keys(candidate)
      });
      
      // Check for safety ratings or blocked content
      if (candidate.finishReason === 'SAFETY') {
        console.error('Content blocked by safety filters:', candidate.safetyRatings);
        throw new Error('Content generation blocked by safety filters');
      }
      
      if (!candidate.content) {
        console.error('Missing content in candidate. Available keys:', Object.keys(candidate));
        throw new Error('Invalid Gemini response: missing content in candidate');
      }
      
      if (!candidate.content.parts || !Array.isArray(candidate.content.parts)) {
        console.error('Missing or invalid parts array. Content structure:', {
          hasParts: !!candidate.content.parts,
          partsType: typeof candidate.content.parts,
          contentKeys: Object.keys(candidate.content)
        });
        throw new Error('Invalid Gemini response: missing or invalid parts array');
      }
      
      if (candidate.content.parts.length === 0) {
        console.error('Empty parts array in candidate content');
        throw new Error('Invalid Gemini response: empty parts array');
      }
      
      const textPart = candidate.content.parts[0];
      console.log('Text part structure:', {
        hasText: !!textPart.text,
        textType: typeof textPart.text,
        partKeys: Object.keys(textPart)
      });
      
      // Extract text from the correct nested path: result.response.candidates[0].content.parts[0].text
      if (!textPart.text || typeof textPart.text !== 'string') {
        console.error('Missing or invalid text in first part. Part structure:', textPart);
        throw new Error('Invalid Gemini response: missing or invalid text content');
      }
      
      generatedText = textPart.text.trim();
      
      if (generatedText.length === 0) {
        throw new Error('Gemini response contains empty text content');
      }
      
      console.log('Successfully extracted text from Gemini response path: result.response.candidates[0].content.parts[0].text');
      console.log('Response text length:', generatedText.length);
      console.log('Response preview:', generatedText.substring(0, 500) + '...');
      console.log('Response ending:', '...' + generatedText.substring(generatedText.length - 200));
      
      // Verify that we're storing only the text content, not the full response object with functions
      console.log('Text extraction validation:');
      console.log('- Extracted content type:', typeof generatedText);
      console.log('- Contains functions:', typeof generatedText === 'object' && generatedText !== null);
      console.log('- Is serializable:', JSON.stringify(generatedText).length > 0);
      
    } catch (validationError) {
      console.error('Gemini response validation failed:', validationError.message);
      console.error('Full result structure for debugging:', JSON.stringify(result, (key, value) => {
        // Filter out functions to avoid circular references in logging
        return typeof value === 'function' ? '[Function]' : value;
      }, 2));
      throw validationError;
    }
    
    console.log('Received response from Gemini AI');
    
    // Enhanced JSON parsing with multiple fallback strategies
    let draftData;
    let parseAttempt = 0;
    const maxParseAttempts = 4;
    
    console.log('Starting JSON parsing with enhanced strategies...');
    console.log('Original response length:', generatedText.length);
    
    while (parseAttempt < maxParseAttempts && !draftData) {
      parseAttempt++;
      console.log(`JSON parsing attempt ${parseAttempt}/${maxParseAttempts}`);
      
      try {
        let cleanedText = generatedText;
        
        switch (parseAttempt) {
          case 1:
            // Strategy 1: Basic markdown cleanup
            console.log('Attempting basic markdown cleanup...');
            cleanedText = generatedText
              .replace(/```json\s*/gi, '')
              .replace(/```\s*/g, '')
              .replace(/^[^{]*({.*})[^}]*$/s, '$1')
              .trim();
            break;
            
          case 2:
            // Strategy 2: More aggressive text cleaning
            console.log('Attempting aggressive text cleaning...');
            cleanedText = generatedText
              .replace(/```[a-zA-Z]*\s*/gi, '') // Remove any code block markers
              .replace(/^[\s\S]*?({[\s\S]*})[\s\S]*?$/g, '$1') // Extract JSON object
              .replace(/\n\s*\/\/.*$/gm, '') // Remove line comments
              .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
              .trim();
            break;
            
          case 3:
            // Strategy 3: Find JSON boundaries more precisely
            console.log('Attempting precise JSON boundary detection...');
            const startIndex = generatedText.indexOf('{');
            const lastIndex = generatedText.lastIndexOf('}');
            if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
              cleanedText = generatedText.substring(startIndex, lastIndex + 1);
            } else {
              cleanedText = generatedText;
            }
            break;
            
          case 4:
            // Strategy 4: Try to fix common JSON issues
            console.log('Attempting JSON repair...');
            cleanedText = generatedText
              .replace(/```[a-zA-Z]*\s*/gi, '')
              .replace(/```\s*/g, '')
              .replace(/([{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":') // Add quotes to unquoted keys
              .replace(/:\s*([^"\[\{][^,}\]]*[^,}\]\s])\s*([,}])/g, ':"$1"$2') // Quote unquoted string values
              .replace(/,\s*}/g, '}') // Remove trailing commas
              .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
              .trim();
            
            // Extract JSON if still embedded in text
            const jsonMatch = cleanedText.match(/{[\s\S]*}/);
            if (jsonMatch) {
              cleanedText = jsonMatch[0];
            }
            break;
        }
        
        console.log(`Attempt ${parseAttempt} - Cleaned text length:`, cleanedText.length);
        console.log(`Attempt ${parseAttempt} - Cleaned text preview:`, cleanedText.substring(0, 300) + '...');
        console.log(`Attempt ${parseAttempt} - Cleaned text ending:`, '...' + cleanedText.substring(cleanedText.length - 100));
        
        // Validate that we have something that looks like JSON
        if (!cleanedText.startsWith('{') || !cleanedText.endsWith('}')) {
          throw new Error(`Attempt ${parseAttempt}: Text doesn't appear to be valid JSON format`);
        }
        
        // Attempt to parse
        console.log(`Attempt ${parseAttempt} - Attempting to parse JSON...`);
        draftData = JSON.parse(cleanedText);
        console.log(`Attempt ${parseAttempt} - Successfully parsed JSON`);
        console.log('Parsed draft type:', typeof draftData);
        console.log('Parsed object keys:', Object.keys(draftData));
        console.log('Parsed draft structure preview:', JSON.stringify(draftData, null, 2).substring(0, 500) + '...');
        
        // Validate the structure
        if (draftData && typeof draftData === 'object') {
          console.log('JSON parsing successful on attempt', parseAttempt);
          console.log('Draft validation passed - object is valid');
          break;
        } else {
          console.log(`Attempt ${parseAttempt} - Parsed result is not a valid object:`, typeof draftData);
          console.log('Parsed result value:', draftData);
          draftData = null;
        }
        
      } catch (parseError) {
        console.log(`JSON parsing attempt ${parseAttempt} failed:`, parseError.message);
        if (parseAttempt === maxParseAttempts) {
          console.log('All JSON parsing attempts failed, proceeding to fallback strategy');
        }
      }
    }
    
    // If JSON parsing failed, use fallback strategy
     if (!draftData) {
       console.log('Creating fallback structured response...');
       
       // Try to extract any recognizable content from the response
       const fallbackSections = {};
       
       // Look for common section patterns in the text
       const sectionPatterns = {
         title: /(?:title|heading)\s*:?\s*["']?([^\n"']+)["']?/i,
         abstract: /(?:abstract|summary)\s*:?\s*["']?([^\n"']+)["']?/i,
         introduction: /(?:introduction|intro)\s*:?\s*["']?([^\n"']+)["']?/i,
         methods: /(?:methods?|methodology)\s*:?\s*["']?([^\n"']+)["']?/i,
         results: /(?:results?)\s*:?\s*["']?([^\n"']+)["']?/i,
         discussion: /(?:discussion)\s*:?\s*["']?([^\n"']+)["']?/i,
         conclusion: /(?:conclusion)\s*:?\s*["']?([^\n"']+)["']?/i
       };
       
       // Extract any recognizable sections
       for (const [section, pattern] of Object.entries(sectionPatterns)) {
         const match = generatedText.match(pattern);
         if (match && match[1]) {
           fallbackSections[section] = match[1].trim();
         }
       }
       
       // Create a minimal valid draft structure
       draftData = {
         title: fallbackSections.title || '[DRAFT GENERATION FAILED - TITLE REQUIRED]',
         abstract: fallbackSections.abstract || '[AI draft unavailable: requires human review]',
         introduction: fallbackSections.introduction || '[STUDENT INPUT REQUIRED]',
         methods: fallbackSections.methods || '[STUDENT INPUT REQUIRED]',
         results: fallbackSections.results || '[STUDENT INPUT REQUIRED]',
         discussion: fallbackSections.discussion || '[STUDENT INPUT REQUIRED]',
         conclusion: fallbackSections.conclusion || '[STUDENT INPUT REQUIRED]',
         references: '[SUGGESTED_REFERENCE - STUDENT INPUT REQUIRED]',
         error_note: 'This draft was generated using fallback parsing due to AI response formatting issues. Please review and complete all sections marked with [STUDENT INPUT REQUIRED].'
       };
       
       console.log('Created fallback draft structure with keys:', Object.keys(draftData));
     }
     
     // Map LLM response sections to expected format
     console.log('Mapping LLM response sections to expected format...');
     
     const sectionMapping = {
       // Handle both numbered and non-numbered formats
       '1. Title': 'title',
       'Title': 'title',
       '2. Introduction': 'introduction',
       'Introduction': 'introduction', 
       '3. Objectives/Aims': 'objectives',
       'Objectives/Aims': 'objectives',
       'Objectives': 'objectives',
       'Aims': 'objectives',
       '4. Materials & Reagents': 'materials',
       'Materials & Reagents': 'materials',
       'Materials': 'materials',
       '5. Procedures': 'procedures',
       'Procedures': 'procedures',
       'Methods': 'procedures',
       '6. Results': 'results',
       'Results': 'results',
       '7. Discussion (Guidance only)': 'discussion',
       'Discussion': 'discussion',
       '8. Recommendations (Guidance only)': 'recommendations',
       'Recommendations': 'recommendations', 
       '9. Conclusion (Guidance only)': 'conclusion',
       'Conclusion': 'conclusion',
       '10. References': 'references',
       'References': 'references'
     };
     
     // Create mapped draft data
     const mappedDraftData = {};
     
     // Map sections to expected keys
     for (const [sourceKey, expectedKey] of Object.entries(sectionMapping)) {
       if (draftData[sourceKey]) {
         mappedDraftData[expectedKey] = draftData[sourceKey];
       }
     }
     
     // Also preserve any existing correctly formatted keys
      const allExpectedSections = ['title', 'abstract', 'introduction', 'objectives', 'materials', 'procedures', 'results', 'discussion', 'recommendations', 'conclusion', 'references'];
      for (const section of allExpectedSections) {
        if (draftData[section] && !mappedDraftData[section]) {
          mappedDraftData[section] = draftData[section];
        }
      }
     
     // Use the mapped data
     draftData = mappedDraftData;
     
     console.log('Validating draft structure...');
     console.log('Mapped sections:', Object.keys(draftData));
     
     // Ensure all required sections exist
     const requiredSections = ['title', 'introduction', 'objectives', 'materials', 'procedures', 'results', 'discussion', 'conclusion', 'references'];
     const missingSections = requiredSections.filter(section => {
       const value = draftData[section];
       return !value || (typeof value === 'string' && value.trim() === '') || (typeof value !== 'string');
     });
     
     if (missingSections.length > 0) {
       console.log('Missing sections detected:', missingSections);
       // Fill in missing sections with placeholder text
       missingSections.forEach(section => {
         draftData[section] = '[STUDENT INPUT REQUIRED]';
       });
     }
     
     // Add abstract if missing (not in LLM output but expected by frontend)
     if (!draftData.abstract) {
       draftData.abstract = '[STUDENT INPUT REQUIRED]';
     }
     
     // Add recommendations if missing (rename from methods if needed)
     if (!draftData.recommendations && draftData.methods) {
       draftData.recommendations = draftData.methods;
       delete draftData.methods;
     }
     
     // Ensure title is not empty or placeholder-only
     if (!draftData.title || (typeof draftData.title === 'string' && (draftData.title.trim() === '' || draftData.title.includes('[DRAFT GENERATION FAILED'))) || typeof draftData.title !== 'string') {
       draftData.title = 'Research Report Draft - Title Required';
     }
     
     console.log('Draft validation completed. Final structure keys:', Object.keys(draftData));
    
    // Comprehensive draft content validation using the new validation function
    try {
      validateDraftContent(draftData);
      console.log('Comprehensive draft validation passed');
    } catch (validationError) {
      console.error('Draft content validation failed:', validationError.message);
      
      // If validation fails, create a safe fallback draft
      console.log('Creating safe fallback draft due to validation failure...');
      draftData = {
        title: 'Research Report Draft - Validation Failed',
        abstract: '[AI draft unavailable: validation failed - requires human review]',
        introduction: '[STUDENT INPUT REQUIRED]',
        objectives: '[STUDENT INPUT REQUIRED]',
        materials: '[STUDENT INPUT REQUIRED]',
        procedures: '[STUDENT INPUT REQUIRED]',
        results: '[STUDENT INPUT REQUIRED]',
        discussion: '[STUDENT INPUT REQUIRED]',
        conclusion: '[STUDENT INPUT REQUIRED]',
        references: '[SUGGESTED_REFERENCE - STUDENT INPUT REQUIRED]',
        error_note: `Draft validation failed: ${validationError.message}. Please review and complete all sections.`
      };
      
      // Re-validate the fallback draft
      try {
        validateDraftContent(draftData);
        console.log('Fallback draft validation passed');
      } catch (fallbackError) {
        console.error('Even fallback draft validation failed:', fallbackError.message);
        throw new Error('Critical validation failure: unable to create valid draft structure');
      }
    }

    console.log('Draft data validation passed, updating database...');

    // Validate that we're storing only serializable text content (not functions or complex objects)
    console.log('Preparing draft data for database storage...');
    console.log('Draft data type:', typeof draftData);
    console.log('Draft data keys:', Object.keys(draftData));
    
    // Ensure the draft data contains only text content and is JSON serializable
    let serializedDraft;
    try {
      console.log('Serializing draft for storage...');
      console.log('Draft object before serialization:', {
        type: typeof draftData,
        keys: Object.keys(draftData),
        hasContent: !!draftData
      });
      
      serializedDraft = JSON.stringify(draftData);
      console.log('Draft serialized for storage successfully');
      console.log('Serialized draft length:', serializedDraft.length);
      console.log('Serialized draft preview:', serializedDraft.substring(0, 300) + '...');
      console.log('Serialized draft ending:', '...' + serializedDraft.substring(serializedDraft.length - 100));
      
      // Verify serialization worked correctly
      if (!serializedDraft || serializedDraft === 'null' || serializedDraft === '{}') {
        console.error('CRITICAL: Serialized draft is empty or null!');
        console.error('Original draft object:', draftData);
        throw new Error('Draft serialization resulted in empty content');
      }
      
      console.log('Draft data successfully serialized. Size:', serializedDraft.length, 'characters');
      
      // Verify serialization doesn't contain function references
      if (serializedDraft.includes('[Function]') || serializedDraft.includes('function')) {
        console.warn('Draft data may contain function references - cleaning...');
        // Clean any function references that might have slipped through
        const cleanedData = JSON.parse(serializedDraft.replace(/"\[Function\]"/g, '"[FUNCTION_REMOVED]"'));
        serializedDraft = JSON.stringify(cleanedData);
      }
      
    } catch (serializationError) {
      console.error('Failed to serialize draft data:', serializationError);
      throw new Error('Draft data contains non-serializable content and cannot be stored');
    }
    
    // Update the draft record in Supabase with exponential backoff
    console.log('Updating draft in Supabase...');
    console.log('Session ID for update:', sessionId);
    console.log('User ID for update:', validUserId);
    console.log('Draft content length:', serializedDraft.length);
    console.log('Draft content preview:', serializedDraft.substring(0, 200) + '...');
    
    let updateSuccess = false;
    let updateAttempts = 0;
    const maxUpdateAttempts = 3;
    
    while (!updateSuccess && updateAttempts < maxUpdateAttempts) {
      try {
        updateAttempts++;
        console.log(`Update attempt ${updateAttempts}/${maxUpdateAttempts}`);
        
        // Build the update query - only filter by user_id if it's not null
        let updateQuery = supabase
          .from('drafts')
          .update({
            draft: serializedDraft, // Store the serialized JSON string
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('session_id', sessionId);
        
        // Only add user_id filter if validUserId is not null (for authenticated users)
        if (validUserId !== null) {
          updateQuery = updateQuery.eq('user_id', validUserId);
          console.log('Adding user_id filter:', validUserId);
        } else {
          // For anonymous drafts, also filter by null user_id to be more specific
          updateQuery = updateQuery.is('user_id', null);
          console.log('Adding null user_id filter for anonymous draft');
        }
        
        // Add timeout for database operations
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Database update timed out')), 10000);
        });
        
        console.log('Executing database update...');
        const { data: updateResult, error: updateError } = await Promise.race([
          updateQuery.select('id, session_id, status, updated_at'),
          timeoutPromise
        ]);
        
        if (updateError) {
          console.error(`Update attempt ${updateAttempts} failed:`, updateError);
          console.error('Error details:', {
            code: updateError.code,
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint
          });
          
          if (updateAttempts === maxUpdateAttempts) {
            throw new Error(`Failed to update draft after ${maxUpdateAttempts} attempts: ${updateError.message}`);
          }
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, updateAttempts) * 1000));
        } else {
          updateSuccess = true;
          console.log('Draft successfully updated in Supabase');
          console.log('Update result:', updateResult);
          
          // Verify the update by checking if any rows were affected
          if (!updateResult || updateResult.length === 0) {
            console.warn('No rows were updated - this might indicate the session_id was not found');
            
            // Check if the draft record exists
            const { data: existingDraft, error: checkError } = await supabase
              .from('drafts')
              .select('id, session_id, user_id, status')
              .eq('session_id', sessionId);
              
            if (checkError) {
              console.error('Error checking existing draft:', checkError);
            } else {
              console.log('Existing draft check result:', existingDraft);
            }
          }
        }
      } catch (error) {
        console.error(`Update attempt ${updateAttempts} error:`, error);
        if (updateAttempts === maxUpdateAttempts) {
          throw new Error(`Database update failed: ${error.message}`);
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, updateAttempts) * 1000));
      }
    }
    
    console.log('Successfully stored extracted text content in drafts table (draft column)');

    console.log('Draft successfully saved to Supabase with session_id:', sessionId);

    // Return only sessionId - frontend will fetch draft from Supabase
    const successResponse = JSON.stringify({
      success: true,
      sessionId: sessionId
    });
    
    // Validate the response is valid JSON before sending
    try {
      JSON.parse(successResponse);
      console.log('Success response validated as valid JSON');
    } catch (validationError) {
      console.error('Success response validation failed:', validationError);
      throw new Error('Failed to create valid JSON response');
    }
    
    return res.status(200).end(successResponse);
    
  } catch (error) {
    console.error('Error in generate-draft handler:', error);
    
    // Determine error type for better handling
    let errorType = 'unknown_error';
    let errorMessage = 'An unexpected error occurred';
    let statusCode = 500;
    
    if (error.message?.includes('API key')) {
      errorType = 'api_key_error';
      errorMessage = 'Invalid or missing API key';
      statusCode = 401;
    } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
      errorType = 'quota_error';
      errorMessage = 'API quota exceeded';
      statusCode = 429;
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorType = 'network_error';
      errorMessage = 'Network connection failed';
      statusCode = 503;
    } else if (error.message?.includes('JSON') || error.message?.includes('parse') || error.message?.includes('serializable')) {
      errorType = 'parsing_error';
      errorMessage = 'Response parsing or serialization failed';
      statusCode = 422;
    } else if (error.message?.includes('database') || error.message?.includes('supabase')) {
      errorType = 'database_error';
      errorMessage = 'Failed to save draft to database';
      statusCode = 503;
    } else if (error.message?.includes('validation')) {
      errorType = 'validation_error';
      errorMessage = 'Input validation failed';
      statusCode = 400;
    } else if (error.message?.includes('response') || error.message?.includes('candidates') || error.message?.includes('content') || error.message?.includes('parts')) {
      errorType = 'gemini_response_error';
      errorMessage = 'Malformed Gemini API response structure';
      statusCode = 502;
    } else if (error.message?.includes('safety') || error.message?.includes('blocked')) {
      errorType = 'content_safety_error';
      errorMessage = 'Content blocked by safety filters';
      statusCode = 400;
    }
    
    // Try to update draft status to failed
    let sessionId;
    try {
      const validatedData = validateInput(req.body);
      sessionId = validatedData?.sessionId;
      
      if (sessionId) {
        await exponentialBackoff(async () => {
          const { error: updateError } = await supabase
            .from('drafts')
            .update({
              status: 'failed',
              updated_at: new Date().toISOString()
            })
            .eq('session_id', sessionId);

          if (updateError) {
            throw updateError;
          }
        });
      }
    } catch (updateError) {
      console.error('Failed to update draft status to failed:', updateError);
    }
    
    // Always return valid JSON response
    const errorResponse = JSON.stringify({
      success: false,
      error: error.message || errorMessage,
      errorType: errorType
    });
    
    // Validate the error response is valid JSON before sending
    try {
      JSON.parse(errorResponse);
      console.log('Error response validated as valid JSON');
    } catch (validationError) {
      console.error('Error response validation failed:', validationError);
      // Fallback to basic error response
      const fallbackResponse = JSON.stringify({
        success: false,
        error: 'An error occurred while processing your request'
      });
      return res.status(500).end(fallbackResponse);
    }
    
    return res.status(statusCode).end(errorResponse);
  }
}

// Configure the router
router.post('/', handler);

// Export the router as default
export default router;

// Export for testing 
export { loadSystemPrompt, validateInput, formatImagesForAI };