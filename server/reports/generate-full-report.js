const express = require('express')
const crypto = require('crypto')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const Ajv = require('ajv')
const { supabase } = require('../../lib/server/supabase.cjs')

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
}

let genAI
let geminiAvailable = false
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    geminiAvailable = true
  }
} catch (_) {
  geminiAvailable = false
}

function validateInput(requestBody) {
  const { parsedText, results, images, prompt, subject, sessionId } = requestBody
  if (!sessionId || typeof sessionId !== 'string') {
    throw new Error('Session ID is required for tracking')
  }
  return {
    parsedText: typeof parsedText === 'string' ? parsedText.trim() : '',
    results: typeof results === 'string' ? results.trim() : '',
    images: Array.isArray(images) ? images : [],
    prompt: typeof prompt === 'string' ? prompt.trim() : 'Return only valid JSON.',
    subject: subject || 'Biology',
    sessionId: sessionId.trim()
  }
}

function formatImagesForAI(images) {
  if (!images || images.length === 0) return ''
  return `\n\nUploaded Images (${images.length} file(s))`
}

function cleanGeminiResponse(rawResponse) {
  try {
    let text = typeof rawResponse === 'string' ? rawResponse : String(rawResponse || '')
    text = text
      .replace(/```json\s*/gi, '')
      .replace(/```/g, '')
      .replace(/,^['"`]|['"`]$/g, '')
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/\\"/g, '"')
      .replace(/\n/g, '\n')
      .trim()
    let candidate = text
    const fenceMatch = candidate.match(/\{[\s\S]*\}/)
    if (fenceMatch) candidate = fenceMatch[0]
    candidate = candidate
      .replace(/([{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
      .replace(/:\s*([^"\[\{][^,}\]]*[^,}\]\s])\s*([,}])/g, ':"$1"$2')
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .trim()
    let parsed
    try {
      parsed = JSON.parse(candidate)
    } catch (_) {
      parsed = {}
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
    }
    const out = {}
    Object.keys(parsed || {}).forEach((k) => {
      const t = map[k] || k
      out[t] = parsed[k]
    })
    const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : [])
    const toString = (v) => {
      if (Array.isArray(v)) return v.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join('\n')
      if (v && typeof v === 'object') return JSON.stringify(v, null, 2)
      return typeof v === 'string' ? v : v ? String(v) : '[STUDENT INPUT REQUIRED]'
    }
    const normalized = {
      title: toString(out.title),
      introduction: toString(out.introduction),
      objectives: toArray(out.objectives).map((x) => (typeof x === 'string' ? x : JSON.stringify(x))),
      materials: toArray(out.materials).map((x) => (typeof x === 'string' ? x : JSON.stringify(x))),
      procedures: toString(out.procedures || out.procedure),
      results: toString(out.results),
      discussion: toString(out.discussion),
      conclusion: toString(out.conclusion),
      recommendations: toArray(out.recommendations).map((x) => (typeof x === 'string' ? x : JSON.stringify(x))),
      references: Array.isArray(out.references) ? out.references : out.references ? [out.references] : []
    }
    return normalized
  } catch (_) {
    return { error: 'Invalid JSON format' }
  }
}

function generateFallbackFullReport(data) {
  const { parsedText, results, images, subject } = data
  const currentDate = new Date().toLocaleDateString()
  const imageInfo = images && images.length > 0 ? `\n\nUploaded Images: ${images.length} file(s)` : ''
  return {
    title: `${subject} Lab Report`,
    introduction: `The experiment conducted involved systematic analysis of the provided materials and procedures. The objective was to gather meaningful data and draw scientific conclusions based on the observations and results obtained during the experimental process.`,
    objectives: [
      'Analyze experimental data systematically',
      'Draw scientific conclusions from observations',
      'Document methodology and results comprehensively'
    ],
    materials: parsedText ? [parsedText] : ['Standard laboratory equipment and materials as specified in the manual'],
    procedures: parsedText || 'Followed standard experimental procedures as outlined in the laboratory manual.',
    results: `${results}${imageInfo}`,
    discussion: `The results obtained from this experiment demonstrate significant findings that warrant detailed analysis. The observations indicate patterns and trends that are consistent with expected scientific principles. These findings contribute to our understanding of the subject matter and have implications for future research and applications in this field.`,
    conclusion: `Based on the comprehensive analysis of the experimental data and observations, the following conclusions can be drawn: 1) The experiment successfully demonstrated the intended scientific principles, 2) The results provide valuable insights into the research question, 3) The methodology was appropriate for achieving the experimental objectives, 4) The data collected supports the stated hypotheses and research goals.`,
    recommendations: [
      'Consider expanding the sample size for more robust results',
      'Implement additional control measures to minimize experimental error',
      'Explore variations in experimental parameters to broaden the scope of findings',
      'Investigate related phenomena that emerged during the experiment',
      'Develop more sophisticated analytical methods for data interpretation'
    ],
    references: ['[Student should add relevant references here based on the specific experiment and subject matter]'],
    pages: `Generated on: ${currentDate}\n\nAbstract: This comprehensive lab report presents the findings and analysis based on the provided experimental data. The report includes detailed methodology, results analysis, and conclusions drawn from the experimental observations.`
  }
}

const router = express.Router()

async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' })
    }
    const validatedData = validateInput(req.body)
    const { parsedText, results, images, prompt, subject, sessionId } = validatedData
    let storedParsedText = parsedText
    let storedResults = results
    try {
      const { data: manualRow, error: manualErr } = await supabase
        .from('manual_templates')
        .select('parsed_text, results')
        .eq('session_id', sessionId)
        .single()
      if (manualErr) throw manualErr
      if (!manualRow || !manualRow.parsed_text || !manualRow.results) {
        throw new Error('Missing manual content or results for this session')
      }
      storedParsedText = typeof manualRow.parsed_text === 'string' ? manualRow.parsed_text : JSON.stringify(manualRow.parsed_text)
      storedResults = manualRow.results
    } catch (e) {
      throw new Error('Unable to retrieve required data for full report')
    }
    const imageInfo = formatImagesForAI(images)
    const variationKey = crypto.randomUUID()
    const userInput = `VARIATION_KEY: ${variationKey}\nManual Excerpt:\n${storedParsedText}\n\nStudent Results/Observations:\n${storedResults}${imageInfo}`
    let generatedText
    let model
    const fullReportPrompt = `${prompt}\n\nReturn ONLY valid JSON with keys: {title, introduction, objectives[], materials[], procedures, results, discussion, conclusion, recommendations[], references[]}. No markdown, no code fences, no commentary.\n\nInput Data:\n${userInput}`
    if (!geminiAvailable || !genAI) {
      generatedText = generateFallbackFullReport(validatedData)
    } else {
      model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { temperature: 0.2, topP: 0.3, maxOutputTokens: 8192 } })
      let result
      try {
        const timeoutPromise = new Promise((_, reject) => { setTimeout(() => reject(new Error('timeout')), 60000) })
        const geminiPromise = model.generateContent(fullReportPrompt)
        result = await Promise.race([geminiPromise, timeoutPromise])
      } catch (geminiError) {
        if (geminiError.message && geminiError.message.includes('timeout')) {
          throw new Error('AI service is currently unavailable (timeout). Please try again later.')
        }
        generatedText = generateFallbackFullReport(validatedData)
      }
      if (result && result.response && !generatedText) {
        try {
          generatedText = result.response.text()
        } catch (_) {
          generatedText = generateFallbackFullReport(validatedData)
        }
      }
    }
    if (!generatedText || (typeof generatedText === 'string' && generatedText.trim().length === 0)) {
      throw new Error('Generated content is empty')
    }
    let reportData
    reportData = typeof generatedText === 'object' ? generatedText : cleanGeminiResponse(generatedText)
    const ajv = new Ajv({ allErrors: true })
    let valid = ajv.validate(reportSchema, reportData)
    if (!valid) {
      if (geminiAvailable && model) {
        const retryPrompt = `${fullReportPrompt}\n\nReturn ONLY valid JSON.`
        try {
          const timeoutPromise = new Promise((_, reject) => { setTimeout(() => reject(new Error('timeout')), 30000) })
          const retryResult = await Promise.race([model.generateContent(retryPrompt), timeoutPromise])
          const retryText = retryResult && retryResult.response ? retryResult.response.text() : ''
          reportData = cleanGeminiResponse(retryText)
          valid = ajv.validate(reportSchema, reportData)
        } catch (_) {}
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
      }
    }
    const serialized = JSON.stringify(reportData)
    let updateSuccess = false
    let attempts = 0
    while (!updateSuccess && attempts < 3) {
      attempts++
      const timeoutPromise = new Promise((_, reject) => { setTimeout(() => reject(new Error('Database update timed out')), 10000) })
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
        .select('id, session_id, updated_at')
      try {
        const { data: updateResult, error: updateError } = await Promise.race([updateQuery, timeoutPromise])
        if (updateError) {
          if (attempts === 3) throw updateError
          await new Promise((r) => setTimeout(r, Math.pow(2, attempts) * 1000))
        } else {
          updateSuccess = true
        }
      } catch (e) {
        if (attempts === 3) throw e
        await new Promise((r) => setTimeout(r, Math.pow(2, attempts) * 1000))
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
        inputSummary: { parsedTextLength: parsedText.length, resultsLength: results.length, imagesCount: images.length }
      }
    }
    if (!geminiAvailable) {
      response.warning = 'AI service temporarily unavailable - using template-based generation. Please verify and customize the content.'
    }
    return res.status(200).json(response)
  } catch (error) {
    let statusCode = 500
    let errorMessage = 'Internal server error during full report generation'
    if (error.message && (error.message.includes('required') || error.message.includes('must be'))) {
      statusCode = 400
      errorMessage = error.message
    } else if (error.message && (error.message.includes('timeout') || error.message.includes('unavailable'))) {
      statusCode = 503
      errorMessage = error.message
    } else if (error.message && error.message.includes('API error')) {
      statusCode = 502
      errorMessage = 'AI service error: ' + error.message
    }
    return res.status(statusCode).json({ success: false, error: errorMessage, timestamp: new Date().toISOString() })
  }
}

router.post('/', handler)

module.exports = router
module.exports.cleanGeminiResponse = cleanGeminiResponse
module.exports.reportSchema = reportSchema
