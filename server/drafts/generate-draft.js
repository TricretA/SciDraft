const crypto = require('crypto')
const express = require('express')
const https = require('https')
const fs = require('fs')
const path = require('path')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const { supabase } = require('../../lib/server/supabase.cjs')

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required')
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

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
   - If info is missing, write "[STUDENT INPUT REQUIRED]".`

  try {
    const promptPath = path.join(process.cwd(), 'gemini_prompt.txt')
    if (fs.existsSync(promptPath)) {
      const content = fs.readFileSync(promptPath, 'utf8')
      return content
    }
    const rootPath = path.join(__dirname, '..', 'gemini_prompt.txt')
    if (fs.existsSync(rootPath)) {
      const content = fs.readFileSync(rootPath, 'utf8')
      return content
    }
    const apiPath = path.join(__dirname, 'gemini_prompt.txt')
    if (fs.existsSync(apiPath)) {
      const content = fs.readFileSync(apiPath, 'utf8')
      return content
    }
    return fallbackPrompt
  } catch (_) {
    return fallbackPrompt
  }
}

function validateInput(requestBody) {
  const data = requestBody.aiData || requestBody
  const { parsedText, results, images, sessionId } = data
  if (!parsedText || typeof parsedText !== 'string' || parsedText.trim().length === 0) {
    throw new Error('Parsed text is required')
  }
  if (parsedText.length > 50000) {
    throw new Error('Parsed text exceeds maximum length of 50,000 characters')
  }
  let processedResults
  if (!results || typeof results !== 'string' || results.trim() === '') {
    processedResults = 'No results provided yet - draft will be generated based on available information'
  } else {
    if (results.length > 20000) {
      throw new Error('Results text exceeds maximum length of 20,000 characters')
    }
    processedResults = results
  }
  if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
    throw new Error('Session ID is required')
  }
  if (!/^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/.test(sessionId.trim())) {
    throw new Error('Session ID must be a valid UUID format')
  }
  let processedImages = []
  if (images !== undefined && images !== null) {
    if (!Array.isArray(images)) {
      throw new Error(`Images must be an array, received: ${typeof images}`)
    }
    if (images.length > 10) {
      throw new Error('Maximum of 10 images allowed')
    }
    processedImages = images.filter((img) => img && typeof img === 'object')
  }
  return {
    parsedText: parsedText.trim(),
    results: processedResults.trim(),
    images: processedImages,
    sessionId: sessionId.trim()
  }
}

function validateDraftContent(draftData) {
  if (!draftData || typeof draftData !== 'object' || Array.isArray(draftData)) {
    throw new Error('Draft data must be an object')
  }
  try {
    JSON.stringify(draftData)
  } catch (_) {
    throw new Error('Draft data contains circular references or non-serializable content')
  }
  const requiredSections = ['title', 'introduction', 'procedures', 'results', 'conclusion']
  const optionalSections = ['objectives', 'materials', 'discussion', 'references']
  const validationErrors = []
  for (const section of requiredSections) {
    const value = draftData[section]
    if (value === undefined || value === null) {
      validationErrors.push(`Missing required section: ${section}`)
      continue
    }
    if (typeof value !== 'string') {
      validationErrors.push(`Section '${section}' must be a string, received: ${typeof value}`)
      continue
    }
    if (value.trim().length === 0) {
      validationErrors.push(`Section '${section}' cannot be empty`)
      continue
    }
    if (value.length > 10000) {
      validationErrors.push(`Section '${section}' exceeds maximum length of 10,000 characters`)
      continue
    }
    if (value.includes('undefined') || value.includes('null') || value.includes('[object Object]')) {
      validationErrors.push(`Section '${section}' contains suspicious content patterns`)
    }
  }
  for (const section of optionalSections) {
    if (!draftData[section] || typeof draftData[section] !== 'string' || draftData[section].trim().length === 0) {
      switch (section) {
        case 'objectives':
          draftData[section] = 'To investigate the relationship between experimental variables and validate theoretical predictions.'
          break
        case 'materials':
          draftData[section] = 'Materials used in this experiment are listed in the procedures section.'
          break
        case 'discussion':
          draftData[section] = 'The experimental results are discussed in relation to theoretical predictions and potential sources of error.'
          break
        case 'references':
          draftData[section] = 'Lab manual and standard textbooks.'
          break
      }
    }
  }
  if (draftData.title) {
    const title = draftData.title.trim()
    if (title.length < 5) {
      validationErrors.push('Title is too short (minimum 5 characters)')
    }
    if (title.length > 200) {
      validationErrors.push('Title is too long (maximum 200 characters)')
    }
    if (/^[\[\(].*[\]\)]$/.test(title)) {
      validationErrors.push('Title appears to be a placeholder or error message')
    }
  }
  const allowedProperties = [...requiredSections, ...optionalSections, 'abstract', 'recommendations', 'error_note', 'metadata']
  const unexpectedProps = Object.keys(draftData).filter((key) => !allowedProperties.includes(key))
  if (unexpectedProps.length > 0) {
  }
  if (validationErrors.length > 0) {
    throw new Error(`Draft validation failed: ${validationErrors.join('; ')}`)
  }
  return true
}

function formatImagesForAI(images) {
  if (!images || images.length === 0) return ''
  return `\n\nUploaded Images (${images.length} files):\n` + images.map((img, index) => `${index + 1}. ${img.name || `Image ${index + 1}`}`).join('\n')
}

async function exponentialBackoff(fn, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      const delay = Math.pow(2, i) * 1000
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}

const router = express.Router()

async function callGeminiStandard(model, prompt) {
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Gemini API call timed out after 60 seconds'))
    }, 60000)
    try {
      const result = await model.generateContent(prompt)
      clearTimeout(timeout)
      resolve(result)
    } catch (error) {
      clearTimeout(timeout)
      reject(error)
    }
  })
}

async function callGeminiDirectHTTP(prompt) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Gemini API key is not configured')
  }
  const requestData = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, topP: 0.8, maxOutputTokens: 8192 }
  }
  const postData = JSON.stringify(requestData)
  const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'User-Agent': 'Node.js/18.0.0'
    },
    timeout: 60000
  }
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const response = JSON.parse(data)
            resolve(response)
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`))
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`))
        }
      })
    })
    req.on('error', (error) => {
      reject(error)
    })
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Direct HTTP call timed out'))
    })
    req.write(postData)
    req.end()
  })
}

async function callGeminiWithFallback(model, prompt, attempt = 1) {
  try {
    if (attempt === 1) {
      return await callGeminiStandard(model, prompt)
    }
    return await callGeminiDirectHTTP(prompt)
  } catch (error) {
    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      return callGeminiWithFallback(model, prompt, attempt + 1)
    }
    throw error
  }
}

function processGeminiResponse(result) {
  let responseData
  if (result && result.response) {
    responseData = result
  } else if (result && result.candidates) {
    responseData = { response: result }
  } else {
    throw new Error('Unknown response format')
  }
  return extractTextFromResponse(responseData)
}

function extractTextFromResponse(result) {
  if (!result || !result.response) {
    throw new Error('Invalid response structure')
  }
  const response = result.response
  if (!response.candidates || !Array.isArray(response.candidates)) {
    throw new Error('Missing or invalid candidates array')
  }
  if (response.candidates.length === 0) {
    throw new Error('Empty candidates array')
  }
  const candidate = response.candidates[0]
  if (candidate.finishReason === 'SAFETY') {
    throw new Error('Content blocked by safety filters')
  }
  if (!candidate.content || !candidate.content.parts || !Array.isArray(candidate.content.parts)) {
    throw new Error('Invalid content structure')
  }
  if (candidate.content.parts.length === 0) {
    throw new Error('Empty parts array')
  }
  const textPart = candidate.content.parts[0]
  if (!textPart.text || typeof textPart.text !== 'string') {
    throw new Error('Invalid text content')
  }
  return textPart.text.trim()
}

async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  try {
    if (!process.env.GEMINI_API_KEY) {
      const errorResponse = JSON.stringify({ success: false, error: 'AI service configuration error. Please contact support.' })
      return res.status(500).end(errorResponse)
    }
    if (req.method !== 'POST') {
      const errorResponse = JSON.stringify({ success: false, error: 'Method not allowed' })
      return res.status(405).end(errorResponse)
    }
    const validatedData = validateInput(req.body)
    let { parsedText, results, images, sessionId } = validatedData
    const { user_id } = req.body
    let validUserId = user_id || null
    let existingDraft
    try {
      const { data, error: checkError } = await supabase.from('drafts').select('id').eq('session_id', sessionId).single()
      if (checkError && checkError.code !== 'PGRST116') {
        throw new Error('Failed to check existing draft record')
      }
      existingDraft = data
    } catch (dbError) {
      throw new Error('Database connection failed during draft check')
    }
    if (existingDraft) {
      try {
        const { error: updateError } = await supabase
          .from('drafts')
          .update({ status: 'processing', updated_at: new Date().toISOString() })
          .eq('session_id', sessionId)
        if (updateError) {
          throw new Error('Failed to update draft record')
        }
      } catch (_) {
        throw new Error('Database connection failed during draft update')
      }
    } else {
      try {
        const { error: insertError } = await supabase
          .from('drafts')
          .insert({ session_id: sessionId, user_id: validUserId, status: 'processing', created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        if (insertError) {
          throw new Error('Failed to create draft record')
        }
      } catch (_) {
        throw new Error('Database connection failed during draft creation')
      }
    }
    const systemPrompt = loadSystemPrompt()
    const imageInfo = formatImagesForAI(images)
    try {
      const { data: manualRow, error: manualErr } = await supabase
        .from('manual_templates')
        .select('session_id, parsed_text, results')
        .eq('session_id', sessionId)
        .single()
      if (manualErr) {
        throw new Error(`Manual template not found for session_id: ${sessionId}`)
      }
      if (!manualRow.parsed_text || !manualRow.results) {
        throw new Error('Required manual content or results missing. Please complete previous steps.')
      }
      parsedText = typeof manualRow.parsed_text === 'string' ? manualRow.parsed_text : JSON.stringify(manualRow.parsed_text)
      results = manualRow.results
    } catch (e) {
      throw e
    }
    const variationKey = crypto.randomUUID()
    const userInput = `VARIATION_KEY: ${variationKey}\nManual Excerpt:\n${parsedText}\n\nStudent Results/Observations:\n${results}${imageInfo}`
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { temperature: 0.2, topP: 0.8, maxOutputTokens: 8192 } })
    const fullPrompt = `${systemPrompt}\n\nInput Data:\n${userInput}`
    try {
      const upsert = await supabase
        .from('reports')
        .upsert({
          session_id: sessionId,
          results_json: { text: results },
          metadata: { source: 'draft', parsed_text: parsedText, images_count: images.length, prompt_used: fullPrompt.substring(0, 1000), variation_key: variationKey },
          updated_at: new Date().toISOString()
        }, { onConflict: 'session_id' })
      if (upsert.error) {
        const update = await supabase
          .from('reports')
          .update({
            results_json: { text: results },
            metadata: { source: 'draft', parsed_text: parsedText, images_count: images.length, prompt_used: fullPrompt.substring(0, 1000), variation_key: variationKey },
            updated_at: new Date().toISOString()
          })
          .eq('session_id', sessionId)
        if (update.error) {
          const insert = await supabase
            .from('reports')
            .insert({
              session_id: sessionId,
              results_json: { text: results },
              metadata: { source: 'draft', parsed_text: parsedText, images_count: images.length, prompt_used: fullPrompt.substring(0, 1000), variation_key: variationKey },
              status: 'draft_limited'
            })
        }
      }
    } catch (_) {}
    let result
    try {
      result = await callGeminiWithFallback(model, fullPrompt)
    } catch (geminiError) {
      if (geminiError.message && geminiError.message.includes('timeout')) {
        throw new Error('AI service is currently unavailable (timeout). Please try again later.')
      }
      throw new Error(`Gemini API error: ${geminiError.message}`)
    }
    let generatedText
    try {
      generatedText = processGeminiResponse(result)
      if (!generatedText || generatedText.length === 0) {
        throw new Error('Gemini response contains empty text content')
      }
    } catch (validationError) {
      throw validationError
    }
    let draftData = null
    let parseAttempt = 0
    const maxParseAttempts = 4
    while (parseAttempt < maxParseAttempts && !draftData) {
      parseAttempt++
      try {
        let cleanedText = generatedText
        switch (parseAttempt) {
          case 1:
            cleanedText = generatedText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').replace(/^[^{]*({.*})[^}]*$/s, '$1').trim()
            break
          case 2:
            cleanedText = generatedText
              .replace(/```[a-zA-Z]*\s*/gi, '')
              .replace(/^[\s\S]*?({[\s\S]*})[\s\S]*?$/g, '$1')
              .replace(/\n\s*\/\/.*$/gm, '')
              .replace(/\/\*[\s\S]*?\*\//g, '')
              .trim()
            break
          case 3:
            const startIndex = generatedText.indexOf('{')
            const lastIndex = generatedText.lastIndexOf('}')
            if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
              cleanedText = generatedText.substring(startIndex, lastIndex + 1)
            } else {
              cleanedText = generatedText
            }
            break
          case 4:
            cleanedText = generatedText
              .replace(/```[a-zA-Z]*\s*/gi, '')
              .replace(/```\s*/g, '')
              .replace(/([{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
              .replace(/:\s*([^"\[\{][^,}\]]*[^,}\]\s])\s*([,}])/g, ':"$1"$2')
              .replace(/,\s*}/g, '}')
              .replace(/,\s*]/g, ']')
              .trim()
            const jsonMatch = cleanedText.match(/{[\s\S]*}/)
            if (jsonMatch) {
              cleanedText = jsonMatch[0]
            }
            break
        }
        if (!cleanedText.startsWith('{') || !cleanedText.endsWith('}')) {
          throw new Error(`Attempt ${parseAttempt}: Text doesn't appear to be valid JSON format`)
        }
        draftData = JSON.parse(cleanedText)
        if (!(draftData && typeof draftData === 'object')) {
          draftData = null
        }
      } catch (_) {}
    }
    if (!draftData) {
      const fallbackSections = {}
      const sectionPatterns = {
        title: /(?:title|heading)\s*:?\s*["']?([^\n"']+)["']?/i,
        abstract: /(?:abstract|summary)\s*:?\s*["']?([^\n"']+)["']?/i,
        introduction: /(?:introduction|intro)\s*:?\s*["']?([^\n"']+)["']?/i,
        methods: /(?:methods?|methodology)\s*:?\s*["']?([^\n"']+)["']?/i,
        results: /(?:results?)\s*:?\s*["']?([^\n"']+)["']?/i,
        discussion: /(?:discussion)\s*:?\s*["']?([^\n"']+)["']?/i,
        conclusion: /(?:conclusion)\s*:?\s*["']?([^\n"']+)["']?/i
      }
      for (const [section, pattern] of Object.entries(sectionPatterns)) {
        const match = generatedText.match(pattern)
        if (match && match[1]) {
          fallbackSections[section] = match[1].trim()
        }
      }
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
      }
    }
    const sectionMapping = {
      '1. Title': 'title',
      Title: 'title',
      '2. Introduction': 'introduction',
      Introduction: 'introduction',
      '3. Objectives/Aims': 'objectives',
      'Objectives/Aims': 'objectives',
      Objectives: 'objectives',
      Aims: 'objectives',
      '4. Materials & Reagents': 'materials',
      'Materials & Reagents': 'materials',
      Materials: 'materials',
      '5. Procedures': 'procedures',
      Procedures: 'procedures',
      Methods: 'procedures',
      '6. Results': 'results',
      Results: 'results',
      '7. Discussion (Guidance only)': 'discussion',
      Discussion: 'discussion',
      '8. Recommendations (Guidance only)': 'recommendations',
      Recommendations: 'recommendations',
      '9. Conclusion (Guidance only)': 'conclusion',
      Conclusion: 'conclusion',
      '10. References': 'references',
      References: 'references'
    }
    const mappedDraftData = {}
    for (const [sourceKey, expectedKey] of Object.entries(sectionMapping)) {
      if (draftData[sourceKey]) {
        mappedDraftData[expectedKey] = draftData[sourceKey]
      }
    }
    const allExpectedSections = ['title', 'abstract', 'introduction', 'objectives', 'materials', 'procedures', 'results', 'discussion', 'recommendations', 'conclusion', 'references']
    for (const section of allExpectedSections) {
      const value = draftData[section]
      if (value && !mappedDraftData[section]) {
        mappedDraftData[section] = value
      }
    }
    draftData = mappedDraftData
    const requiredSections = ['title', 'introduction', 'objectives', 'materials', 'procedures', 'results', 'discussion', 'conclusion', 'references']
    const missingSections = requiredSections.filter((section) => {
      const value = draftData[section]
      return !value || (typeof value === 'string' && value.trim() === '') || typeof value !== 'string'
    })
    if (missingSections.length > 0) {
      missingSections.forEach((section) => {
        draftData[section] = '[STUDENT INPUT REQUIRED]'
      })
    }
    if (!draftData.abstract) {
      draftData.abstract = '[STUDENT INPUT REQUIRED]'
    }
    if (!draftData.recommendations && draftData.methods) {
      draftData.recommendations = draftData.methods
      delete draftData.methods
    }
    if (!draftData.title || (typeof draftData.title === 'string' && (draftData.title.trim() === '' || draftData.title.includes('[DRAFT GENERATION FAILED'))) || typeof draftData.title !== 'string') {
      draftData.title = 'Research Report Draft - Title Required'
    }
    const canonicalSectionKeys = ['title', 'introduction', 'objectives', 'materials', 'procedures', 'results', 'discussion', 'conclusion', 'recommendations', 'references']
    const presentCanonical = canonicalSectionKeys.filter((k) => typeof draftData[k] === 'string' && draftData[k].trim().length > 0)
    const hasAllCanonical = presentCanonical.length === canonicalSectionKeys.length
    try {
      validateDraftContent(draftData)
    } catch (validationError) {
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
      }
      try {
        validateDraftContent(draftData)
      } catch (fallbackError) {
        throw new Error('Critical validation failure: unable to create valid draft structure')
      }
    }
    let serializedDraft
    try {
      serializedDraft = JSON.stringify(draftData)
      if (!serializedDraft || serializedDraft === 'null' || serializedDraft === '{}') {
        throw new Error('Draft serialization resulted in empty content')
      }
      if (serializedDraft.includes('[Function]') || serializedDraft.includes('function')) {
        const cleanedData = JSON.parse(serializedDraft.replace(/"\[Function\]"/g, '"[FUNCTION_REMOVED]"'))
        serializedDraft = JSON.stringify(cleanedData)
      }
    } catch (_) {
      throw new Error('Draft data contains non-serializable content and cannot be stored')
    }
    let updateSuccess = false
    let updateAttempts = 0
    const maxUpdateAttempts = 3
    while (!updateSuccess && updateAttempts < maxUpdateAttempts) {
      try {
        updateAttempts++
        let updateQuery = supabase
          .from('drafts')
          .update({ draft: serializedDraft, status: 'completed', updated_at: new Date().toISOString() })
          .eq('session_id', sessionId)
        if (validUserId !== null) {
          updateQuery = updateQuery.eq('user_id', validUserId)
        } else {
          updateQuery = updateQuery.is('user_id', null)
        }
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Database update timed out')), 10000)
        })
        const { data: updateResult, error: updateError } = await Promise.race([updateQuery.select('id, session_id, status, updated_at'), timeoutPromise])
        if (updateError) {
          if (updateAttempts === maxUpdateAttempts) {
            throw new Error(`Failed to update draft after ${maxUpdateAttempts} attempts: ${updateError.message}`)
          }
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, updateAttempts) * 1000))
        } else {
          updateSuccess = true
          if (!updateResult || updateResult.length === 0) {
            await supabase.from('drafts').select('id, session_id, user_id, status').eq('session_id', sessionId)
          }
        }
      } catch (error) {
        if (updateAttempts === maxUpdateAttempts) {
          throw new Error(`Database update failed: ${error.message}`)
        }
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, updateAttempts) * 1000))
      }
    }
    try {
      const { error: upsertError } = await supabase
        .from('reports')
        .upsert({
          session_id: sessionId,
          draft_json: JSON.parse(serializedDraft),
          results_json: results ? { text: results } : null,
          metadata: { source: 'draft', parsed_text: parsedText, images_count: images.length, prompt_used: fullPrompt.substring(0, 1000) },
          updated_at: new Date().toISOString()
        }, { onConflict: 'session_id' })
      if (upsertError) {}
    } catch (_) {}
    const successResponse = JSON.stringify({ success: true, sessionId })
    try {
      JSON.parse(successResponse)
    } catch (_) {
      throw new Error('Failed to create valid JSON response')
    }
    return res.status(200).end(successResponse)
  } catch (error) {
    let errorType = 'unknown_error'
    let errorMessage = 'An unexpected error occurred'
    let statusCode = 500
    if (error.message && error.message.includes('API key')) {
      errorType = 'api_key_error'
      errorMessage = 'Invalid or missing API key'
      statusCode = 401
    } else if (error.message && (error.message.includes('quota') || error.message.includes('limit'))) {
      errorType = 'quota_error'
      errorMessage = 'API quota exceeded'
      statusCode = 429
    } else if (error.message && (error.message.includes('network') || error.message.includes('fetch'))) {
      errorType = 'network_error'
      errorMessage = 'Network connection failed'
      statusCode = 503
    } else if (error.message && (error.message.includes('JSON') || error.message.includes('parse') || error.message.includes('serializable'))) {
      errorType = 'parsing_error'
      errorMessage = 'Response parsing or serialization failed'
      statusCode = 422
    } else if (error.message && (error.message.includes('database') || error.message.includes('supabase'))) {
      errorType = 'database_error'
      errorMessage = 'Failed to save draft to database'
      statusCode = 503
    } else if (error.message && error.message.includes('validation')) {
      errorType = 'validation_error'
      errorMessage = 'Input validation failed'
      statusCode = 400
    } else if (error.message && (error.message.includes('response') || error.message.includes('candidates') || error.message.includes('content') || error.message.includes('parts'))) {
      errorType = 'gemini_response_error'
      errorMessage = 'Malformed Gemini API response structure'
      statusCode = 502
    } else if (error.message && (error.message.includes('safety') || error.message.includes('blocked'))) {
      errorType = 'content_safety_error'
      errorMessage = 'Content blocked by safety filters'
      statusCode = 400
    }
    let sessionId
    try {
      const validatedData = validateInput(req.body)
      sessionId = validatedData && validatedData.sessionId
      if (sessionId) {
        await exponentialBackoff(async () => {
          const { error: updateError } = await supabase
            .from('drafts')
            .update({ status: 'failed', updated_at: new Date().toISOString() })
            .eq('session_id', sessionId)
          if (updateError) throw updateError
        })
      }
    } catch (_) {}
    const errorResponse = JSON.stringify({ success: false, error: error.message || errorMessage, errorType })
    try {
      JSON.parse(errorResponse)
    } catch (_) {
      const fallbackResponse = JSON.stringify({ success: false, error: 'An error occurred while processing your request' })
      return res.status(500).end(fallbackResponse)
    }
    return res.status(statusCode).end(errorResponse)
  }
}

router.post('/', handler)

module.exports = router

