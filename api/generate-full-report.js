import crypto from 'crypto';
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const Ajv = require('ajv');

// Full report JSON schema (exported for tests)
const reportSchema = {
  type: 'object',
  required: ['title','introduction','objectives','materials','procedures','results','discussion','conclusion','recommendations','references'],
  properties: {
    title: { type: 'string' },
    introduction: { type: 'string' },
    objectives: { type: 'array', items: { type: 'string' } },
    materials: { type: 'array', items: { type: 'string' } },
    procedures: { type: 'string' },
    results: { type: 'string' },
    discussion: { type: 'string' },
    conclusion: { type: 'string' },
    recommendations: { type: 'array', items: { type: 'string' } },
    references: { oneOf: [
      { type: 'array', items: { type: 'string' } },
      { type: 'array', items: { type: 'object', properties: { author:{type:'string'}, year:{type:'string'}, title:{type:'string'}, edition:{type:'string'}, page:{type:'string'} }, required: ['author','year','title'] } }
    ] }
  }
};

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
  if (!sessionId || typeof sessionId !== 'string') {
    throw new Error('Session ID is required for tracking');
  }
  return {
    parsedText: typeof parsedText === 'string' ? parsedText.trim() : '',
    results: typeof results === 'string' ? results.trim() : '',
    images: Array.isArray(images) ? images : [],
    prompt: typeof prompt === 'string' ? prompt.trim() : 'Return only valid JSON.',
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

function cleanGeminiResponse(rawResponse) {
  try {
    let text = typeof rawResponse === 'string' ? rawResponse : String(rawResponse || '');
    text = text
      .replace(/```json\s*/gi, '')
      .replace(/```/g, '')
      .replace(/^['"`]|['"`]$/g, '')
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/\\"/g, '"')
      .replace(/\n/g, '\n')
      .trim();

    let candidate = text;
    const fenceMatch = candidate.match(/\{[\s\S]*\}/);
    if (fenceMatch) candidate = fenceMatch[0];
    candidate = candidate
      .replace(/([{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
      .replace(/:\s*([^"\[\{][^,}\]]*[^,}\]\s])\s*([,}])/g, ':"$1"$2')
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(candidate);
    } catch (e) {
      parsed = {};
    }

    const map = {
      title: 'title',
      introduction: 'introduction',
      objectives: 'objectives',
      aims: 'objectives',
      materials: 'materials',
      reagents: 'materials',
      procedure: 'procedures',
      procedures: 'procedures',
      methods: 'procedures',
      results: 'results',
      discussion: 'discussion',
      conclusion: 'conclusion',
      recommendations: 'recommendations',
      references: 'references'
    };

    const out = {};
    Object.keys(parsed || {}).forEach(k => {
      const t = map[k] || k;
      out[t] = parsed[k];
    });

    const toArray = v => Array.isArray(v) ? v : (v ? [v] : []);
    const toString = v => {
      if (Array.isArray(v)) return v.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join('\n');
      if (v && typeof v === 'object') return JSON.stringify(v, null, 2);
      return typeof v === 'string' ? v : (v ? String(v) : '[STUDENT INPUT REQUIRED]');
    };

    const normalized = {
      title: toString(out.title),
      introduction: toString(out.introduction),
      objectives: toArray(out.objectives).map(x => typeof x === 'string' ? x : JSON.stringify(x)),
      materials: toArray(out.materials).map(x => typeof x === 'string' ? x : JSON.stringify(x)),
      procedures: toString(out.procedures || out.procedure),
      results: toString(out.results),
      discussion: toString(out.discussion),
      conclusion: toString(out.conclusion),
      recommendations: toArray(out.recommendations).map(x => typeof x === 'string' ? x : JSON.stringify(x)),
      references: Array.isArray(out.references) ? out.references : (out.references ? [out.references] : [])
    };

    return normalized;
  } catch (err) {
    return { error: 'Invalid JSON format' };
  }
}

// Fallback report generation when Gemini AI is unavailable
function generateFallbackFullReport(data) {
  const { parsedText, results, images, subject } = data;
  
  console.log('📝 Generating fallback full report...');
  
  const currentDate = new Date().toLocaleDateString();
  const imageInfo = images && images.length > 0 ? `\n\nUploaded Images: ${images.length} file(s)` : '';
  
  // Generate structured JSON report instead of plain text
  const fallbackReport = {
    title: `${subject} Lab Report`,
    introduction: `The experiment conducted involved systematic analysis of the provided materials and procedures. The objective was to gather meaningful data and draw scientific conclusions based on the observations and results obtained during the experimental process.`,
    objectives: [
      "Analyze experimental data systematically",
      "Draw scientific conclusions from observations",
      "Document methodology and results comprehensively"
    ],
    materials: parsedText ? [parsedText] : ["Standard laboratory equipment and materials as specified in the manual"],
    procedures: parsedText || "Followed standard experimental procedures as outlined in the laboratory manual.",
    results: `${results}${imageInfo}`,
    discussion: `The results obtained from this experiment demonstrate significant findings that warrant detailed analysis. The observations indicate patterns and trends that are consistent with expected scientific principles. These findings contribute to our understanding of the subject matter and have implications for future research and applications in this field.`,
    conclusion: `Based on the comprehensive analysis of the experimental data and observations, the following conclusions can be drawn: 1) The experiment successfully demonstrated the intended scientific principles, 2) The results provide valuable insights into the research question, 3) The methodology was appropriate for achieving the experimental objectives, 4) The data collected supports the stated hypotheses and research goals.`,
    recommendations: [
      "Consider expanding the sample size for more robust results",
      "Implement additional control measures to minimize experimental error", 
      "Explore variations in experimental parameters to broaden the scope of findings",
      "Investigate related phenomena that emerged during the experiment",
      "Develop more sophisticated analytical methods for data interpretation"
    ],
    references: ["[Student should add relevant references here based on the specific experiment and subject matter]"],
    pages: `Generated on: ${currentDate}\n\nAbstract: This comprehensive lab report presents the findings and analysis based on the provided experimental data. The report includes detailed methodology, results analysis, and conclusions drawn from the experimental observations.`
  };

  console.log('✅ Fallback JSON report generated successfully');
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
    
    // Retrieve authoritative payload from manual_templates
    let storedParsedText = parsedText;
    let storedResults = results;
    try {
      const { data: manualRow, error: manualErr } = await supabase
        .from('manual_templates')
        .select('parsed_text, results')
        .eq('session_id', sessionId)
        .single();
      if (manualErr) throw manualErr;
      if (!manualRow || !manualRow.parsed_text || !manualRow.results) {
        throw new Error('Missing manual content or results for this session');
      }
      storedParsedText = typeof manualRow.parsed_text === 'string' ? manualRow.parsed_text : JSON.stringify(manualRow.parsed_text);
      storedResults = manualRow.results;
    } catch (e) {
      console.error('Payload retrieval failed:', e.message);
      throw new Error('Unable to retrieve required data for full report');
    }

    const imageInfo = formatImagesForAI(images);
    const variationKey = crypto.randomUUID();
    console.log('Variation key for this full report generation:', variationKey);
    const userInput = `VARIATION_KEY: ${variationKey}\nManual Excerpt:\n${storedParsedText}\n\nStudent Results/Observations:\n${storedResults}${imageInfo}`;
    
    let generatedText;
    let model;
    const fullReportPrompt = `${prompt}\n\nReturn ONLY valid JSON with keys: {title, introduction, objectives[], materials[], procedures, results, discussion, conclusion, recommendations[], references[]}. No markdown, no code fences, no commentary.\n\nInput Data:\n${userInput}`;
    
    // Check if Gemini AI is available
    if (!geminiAvailable || !genAI) {
      console.warn('⚠️ Gemini AI not available - using fallback report generation');
      
      // Generate fallback report based on input data
      generatedText = generateFallbackFullReport(validatedData);
      console.log('✅ Fallback report generated successfully');
    } else {
      // Create enhanced prompt for full report generation
      // Initialize Gemini model with settings optimized for longer, detailed content
      model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.2,
          topP: 0.3,
          maxOutputTokens: 8192,
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
    
    // Parse AI response into JSON format for ReportRenderer
    let reportData;
    reportData = typeof generatedText === 'object' ? generatedText : cleanGeminiResponse(generatedText);

    const ajv = new Ajv({ allErrors: true });
    let valid = ajv.validate(reportSchema, reportData);
    if (!valid) {
      if (geminiAvailable && model) {
        const retryPrompt = `${fullReportPrompt}\n\nReturn ONLY valid JSON.`;
        let retryResult;
        try {
          const timeoutPromise = new Promise((_, reject) => { setTimeout(() => reject(new Error('timeout')), 30000); });
          retryResult = await Promise.race([model.generateContent(retryPrompt), timeoutPromise]);
          const retryText = retryResult && retryResult.response ? retryResult.response.text() : '';
          reportData = cleanGeminiResponse(retryText);
          valid = ajv.validate(reportSchema, reportData);
        } catch {}
      }
    }

    if (!valid) {
      reportData = {
        title: subject + ' Lab Report',
        introduction: '[STUDENT INPUT REQUIRED]',
        objectives: [],
        materials: [],
        procedures: '[STUDENT INPUT REQUIRED]',
        results: '[STUDENT INPUT REQUIRED]',
        discussion: '[STUDENT INPUT REQUIRED]',
        conclusion: '[STUDENT INPUT REQUIRED]',
        recommendations: [],
        references: []
      };
    }
    
    const canonicalKeys = ['title','introduction','objectives','materials','procedures','results','discussion','conclusion','recommendations','references'];
    const presentCanonical = canonicalKeys.filter(k => reportData && typeof reportData[k] !== 'undefined');
    const hasAllCanonical = presentCanonical.length === canonicalKeys.length;
    console.log('Schema compliance check (full report):', { variationKey, hasAllCanonical, presentCanonicalCount: presentCanonical.length });
    
    // Return the generated full report as JSON
    const serialized = JSON.stringify(reportData);

    let updateSuccess = false;
    let attempts = 0;
    while (!updateSuccess && attempts < 3) {
      attempts++;
      const timeoutPromise = new Promise((_, reject) => { setTimeout(() => reject(new Error('Database update timed out')), 10000); });
      const updateQuery = supabase
        .from('reports')
        .update({
          content: serialized,
          subject: subject,
          metadata: {
            generatedAt: new Date().toISOString(),
            aiService: geminiAvailable ? 'gemini' : 'fallback',
            parsedTextLength: parsedText.length,
            resultsLength: results.length,
            imagesCount: images.length,
            variation_key: variationKey
          },
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .select('id, session_id, updated_at');
      try {
        const { data: updateResult, error: updateError } = await Promise.race([updateQuery, timeoutPromise]);
        if (updateError) {
          if (attempts === 3) throw updateError;
          await new Promise(r => setTimeout(r, Math.pow(2, attempts) * 1000));
        } else {
          updateSuccess = true;
          console.log('✅ Reports table updated for session_id:', sessionId);
          console.log('Update result:', updateResult);
        }
      } catch (e) {
        if (attempts === 3) throw e;
        await new Promise(r => setTimeout(r, Math.pow(2, attempts) * 1000));
      }
    }

    const response = {
      success: true,
      content: reportData,
      metadata: {
        subject: subject,
        generatedAt: new Date().toISOString(),
        contentLength: serialized.length,
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
module.exports = router;
module.exports.cleanGeminiResponse = cleanGeminiResponse;
module.exports.reportSchema = reportSchema;
