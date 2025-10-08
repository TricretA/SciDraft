import { GoogleGenerativeAI } from '@google/generative-ai';
import express from 'express';
import { createClient } from '@supabase/supabase-js';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyApDWgDSJ_tohn9ufNlPLV8Z35eyganK6s');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://jjgynhecxcnpizwdzsdi.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZ3luaGVjeGNucGl6d2R6c2RpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQ0NDU5NiwiZXhwIjoyMDczMDIwNTk2fQ.2NTxVijBWrrHiQAZkq5j9yh8MofTbJ070RlzDDFWRic'
);

// Validate and format input data
function validateInput(requestBody) {
  const { parsedText, results, images, prompt, subject, sessionId } = requestBody;
  
  if (!parsedText || typeof parsedText !== 'string') {
    throw new Error('Parsed text is required and must be a string');
  }
  
  if (!results || typeof results !== 'string') {
    console.warn('Results not provided - will generate report with manual content only');
  }
  
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('AI prompt is required and must be a string');
  }
  
  if (!sessionId || typeof sessionId !== 'string') {
    throw new Error('Session ID is required for tracking');
  }
  
  return {
    parsedText: parsedText.trim(),
    results: (results || '').trim(),
    images: Array.isArray(images) ? images : [],
    prompt: prompt.trim(),
    subject: subject || 'Biology',
    sessionId: sessionId.trim()
  };
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
async function exponentialBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms delay`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

const router = express.Router();

// Main full report generation function
async function handler(req, res) {
  // Set response headers to ensure proper JSON content type
  res.setHeader('Content-Type', 'application/json');
  
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }

    console.log('Starting full report generation...');
    
    // Validate input data
    const validatedData = validateInput(req.body);
    const { parsedText, results, images, prompt, subject, sessionId } = validatedData;
    
    console.log('Input validation successful');
    console.log('Session ID:', sessionId);
    console.log('Subject:', subject);
    console.log('Parsed text length:', parsedText.length);
    console.log('Results length:', results.length);
    console.log('Images count:', images.length);
    
    // Format the user input for full report generation
    const imageInfo = formatImagesForAI(images);
    const userInput = `Manual Excerpt:\n${parsedText}\n\nStudent Results/Observations:\n${results}${imageInfo}`;
    
    // Create enhanced prompt for full report generation
    const fullReportPrompt = `${prompt}\n\nIMPORTANT: Generate a comprehensive, detailed full report based on the provided data. This should be significantly more detailed than a draft, including:\n\n1. Detailed analysis of results\n2. In-depth discussion of findings\n3. Comprehensive conclusions\n4. Detailed recommendations\n5. Proper scientific formatting\n\nInput Data:\n${userInput}\n\nGenerate a complete, professional lab report with all sections fully developed.`;
    
    // Initialize Gemini model with settings optimized for longer, detailed content
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.3, // Slightly higher for more creative full report
        topP: 0.9,
        maxOutputTokens: 8192, // Higher token limit for full reports
      }
    });
    
    console.log('Sending request to Gemini AI for full report generation...');
    
    // Generate full report with timeout and retry logic
    let result;
    try {
      // Create timeout promise (60 seconds for full reports)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), 60000);
      });
      
      const geminiPromise = model.generateContent(fullReportPrompt);
      
      result = await Promise.race([geminiPromise, timeoutPromise]);
      console.log('Gemini AI call completed successfully');
    } catch (geminiError) {
      console.error('Gemini AI call failed:', geminiError);
      if (geminiError.message.includes('timeout')) {
        throw new Error('AI service is currently unavailable (timeout). Please try again later.');
      }
      throw new Error(`Gemini API error: ${geminiError.message}`);
    }
    
    // Extract and validate response
    let generatedText;
    try {
      if (result && result.response) {
        generatedText = result.response.text();
      } else {
        throw new Error('Invalid response structure from Gemini AI');
      }
    } catch (extractError) {
      console.error('Error extracting text from Gemini response:', extractError);
      throw new Error('Failed to extract generated content from AI response');
    }
    
    if (!generatedText || generatedText.trim().length === 0) {
      throw new Error('Generated content is empty');
    }
    
    console.log('Full report generated successfully');
    console.log('Generated content length:', generatedText.length);
    
    // Return the generated full report
    const response = {
      success: true,
      content: generatedText.trim(),
      metadata: {
        subject: subject,
        generatedAt: new Date().toISOString(),
        contentLength: generatedText.trim().length,
        inputSummary: {
          parsedTextLength: parsedText.length,
          resultsLength: results.length,
          imagesCount: images.length
        }
      }
    };
    
    console.log('Returning successful response');
    return res.status(200).json(response);
    
  } catch (error) {
    console.error('Full report generation error:', error);
    
    // Determine appropriate error response
    let statusCode = 500;
    let errorMessage = 'Internal server error during full report generation';
    
    if (error.message.includes('required') || error.message.includes('must be')) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message.includes('timeout') || error.message.includes('unavailable')) {
      statusCode = 503;
      errorMessage = error.message;
    } else if (error.message.includes('API error')) {
      statusCode = 502;
      errorMessage = 'AI service error: ' + error.message;
    }
    
    const errorResponse = {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    };
    
    return res.status(statusCode).json(errorResponse);
  }
}

// Set up the router
router.post('/', handler);

export default router;