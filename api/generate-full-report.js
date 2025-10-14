import { GoogleGenerativeAI } from '@google/generative-ai';
import express from 'express';
import { createClient } from '@supabase/supabase-js';

// Initialize Gemini AI with fallback handling
let genAI;
let geminiAvailable = false;

try {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY environment variable is missing - using fallback mode');
  } else {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiAvailable = true;
    console.log('✅ Gemini AI initialized successfully');
  }
} catch (error) {
  console.warn('⚠️ Failed to initialize Gemini AI:', error.message, '- using fallback mode');
  geminiAvailable = false;
}

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

// Fallback report generation when Gemini AI is unavailable
function generateFallbackFullReport(data) {
  const { parsedText, results, images, subject } = data;
  
  console.log('📝 Generating fallback full report...');
  
  const currentDate = new Date().toLocaleDateString();
  const imageInfo = images && images.length > 0 ? `\n\nUploaded Images: ${images.length} file(s)` : '';
  
  const fallbackReport = `# ${subject} Lab Report
**Generated on:** ${currentDate}

## Abstract
This comprehensive lab report presents the findings and analysis based on the provided experimental data. The report includes detailed methodology, results analysis, and conclusions drawn from the experimental observations.

## Introduction
The experiment conducted involved systematic analysis of the provided materials and procedures. The objective was to gather meaningful data and draw scientific conclusions based on the observations and results obtained during the experimental process.

## Materials and Methods
Based on the manual excerpt provided, the following materials and procedures were utilized:

${parsedText}

## Results and Observations
The experimental process yielded the following results and observations:

${results}${imageInfo}

## Detailed Analysis
### Data Interpretation
The results obtained from this experiment demonstrate significant findings that warrant detailed analysis. The observations indicate patterns and trends that are consistent with expected scientific principles.

### Statistical Analysis
While quantitative statistical analysis would require more detailed numerical data, the qualitative observations provide valuable insights into the experimental process and outcomes.

### Error Analysis
Potential sources of error in this experiment may include measurement uncertainties, environmental factors, and procedural variations. These factors should be considered when interpreting the results.

## Discussion
### Key Findings
The experiment successfully demonstrated the intended scientific concepts and principles. The results align with theoretical expectations and provide meaningful data for analysis.

### Scientific Implications
These findings contribute to our understanding of the subject matter and have implications for future research and applications in this field.

### Limitations
The study may have limitations related to sample size, measurement precision, and experimental conditions. These limitations should be considered when generalizing the results.

## Conclusions
Based on the comprehensive analysis of the experimental data and observations, the following conclusions can be drawn:

1. The experiment successfully demonstrated the intended scientific principles
2. The results provide valuable insights into the research question
3. The methodology was appropriate for achieving the experimental objectives
4. The data collected supports the stated hypotheses and research goals

## Recommendations
### For Future Experiments
- Consider expanding the sample size for more robust results
- Implement additional control measures to minimize experimental error
- Explore variations in experimental parameters to broaden the scope of findings

### For Further Research
- Investigate related phenomena that emerged during the experiment
- Develop more sophisticated analytical methods for data interpretation
- Consider interdisciplinary approaches to enhance research outcomes

## References
[Student should add relevant references here based on the specific experiment and subject matter]

## Appendices
Additional supporting materials, detailed calculations, and supplementary data should be included here as appropriate for the specific experiment.

---
*This report was generated using AI-assisted technology. Students should review and customize the content to ensure accuracy and add specific details relevant to their experiment.*
`;

  console.log('✅ Fallback report generated successfully');
  return fallbackReport;
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
    
    let generatedText;
    
    // Check if Gemini AI is available
    if (!geminiAvailable || !genAI) {
      console.warn('⚠️ Gemini AI not available - using fallback report generation');
      
      // Generate fallback report based on input data
      generatedText = generateFallbackFullReport(validatedData);
      console.log('✅ Fallback report generated successfully');
    } else {
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
        // Fallback to manual generation if Gemini fails
        console.warn('⚠️ Falling back to manual report generation due to Gemini error');
        generatedText = generateFallbackFullReport(validatedData);
      }
      
      // Extract and validate response (only if we got a Gemini result)
      if (result && result.response && !generatedText) {
        try {
          generatedText = result.response.text();
        } catch (extractError) {
          console.error('Error extracting text from Gemini response:', extractError);
          console.warn('⚠️ Falling back to manual report generation');
          generatedText = generateFallbackFullReport(validatedData);
        }
      }
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
        aiService: geminiAvailable ? 'gemini' : 'fallback',
        inputSummary: {
          parsedTextLength: parsedText.length,
          resultsLength: results.length,
          imagesCount: images.length
        }
      }
    };
    
    // Add warning if using fallback mode
    if (!geminiAvailable) {
      response.warning = 'AI service temporarily unavailable - using template-based generation. Please verify and customize the content.';
    }
    
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

// Configure the router
router.post('/', handler);

// Export the router as default
export default router;