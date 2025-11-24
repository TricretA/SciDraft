const express = require('express')
const { supabase } = require('../lib/supabase')

const router = express.Router()
const { randomUUID } = require('crypto')

async function ensureBucket(bucket) {
  try {
    const { data: buckets } = await supabase.storage.listBuckets()
    const exists = (buckets || []).some(b => b.name === bucket)
    if (!exists) {
      await supabase.storage.createBucket(bucket, { public: true })
    }
  } catch (_) {}
}

router.post('/upload', async (req, res) => {
  try {
    const { unitName, practicalTitle, practicalNumber, subject, manualContent, file } = req.body || {}
    if (!practicalTitle || !unitName || !practicalNumber) {
      return res.status(400).json({ success: false, error: 'Missing required fields' })
    }

    let manualUrl = 'manual_upload_placeholder'
    if (file && file.base64 && file.name) {
      await ensureBucket('manuals')
      const filePath = `${Date.now()}-${file.name}`
      const buffer = Buffer.from(file.base64, 'base64')
      const upload = await supabase.storage.from('manuals').upload(filePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false
      })
      if (upload.error) {
        return res.status(500).json({ success: false, error: upload.error.message })
      }
      const pub = supabase.storage.from('manuals').getPublicUrl(filePath)
      manualUrl = (pub && pub.data && pub.data.publicUrl) || filePath
    }

    const sessionId = randomUUID()

    const insert = await supabase
      .from('manual_templates')
      .insert({
        manual_url: manualUrl,
        parsed_text: manualContent,
        uploaded_by: null,
        practical_title: String(practicalTitle).trim(),
        practical_number: Number(practicalNumber),
        unit_code: String(unitName).trim() || 'UNKNOWN',
        subject,
        session_id: sessionId
      })
      .select()

    if (insert.error) {
      return res.status(500).json({ success: false, error: insert.error.message })
    }

    return res.status(200).json({ success: true, data: insert.data && insert.data[0], manualUrl, sessionId })
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' })
  }
})

// Save raw results to manual_templates for a given session_id
router.post('/results', async (req, res) => {
  try {
    const { sessionId, results } = req.body || {}
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ success: false, error: 'sessionId is required' })
    }
    if (!results || typeof results !== 'string' || !results.trim()) {
      return res.status(400).json({ success: false, error: 'results text is required' })
    }
    const { data, error } = await supabase
      .from('manual_templates')
      .update({ results: results.trim(), updated_at: new Date().toISOString() })
      .eq('session_id', sessionId)
      .select('id, session_id, results')
      .single()
    if (error) {
      return res.status(500).json({ success: false, error: error.message })
    }
    return res.status(200).json({ success: true, data })
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' })
  }
})

// Import a template from admin_manual_templates into manual_templates, idempotent by session_id
router.post('/import-template', async (req, res) => {
  try {
    const { templateId, sessionId: incomingSessionId } = req.body || {}
    if (!templateId) {
      return res.status(400).json({ success: false, error: 'templateId is required' })
    }

    const { data: tpl, error: tplErr } = await supabase
      .from('admin_manual_templates')
      .select('id, unit_code, practical_title, practical_number, practical_content, subject')
      .eq('id', templateId)
      .maybeSingle()
    if (tplErr) {
      return res.status(500).json({ success: false, error: tplErr.message })
    }
    if (!tpl) {
      return res.status(404).json({ success: false, error: 'Template not found' })
    }

    const isUuid = (s) => typeof s === 'string' && /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/.test(s.trim())
    const sessionId = isUuid(incomingSessionId) ? incomingSessionId.trim() : randomUUID()

    const normalizeText = (s) => {
      if (!s || typeof s !== 'string') return ''
      return s.replace(/\r\n/g, '\n').replace(/\t/g, ' ').replace(/ +/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
    }

    const parsed = normalizeText(tpl.practical_content)
    if (!parsed || parsed.length < 10) {
      return res.status(400).json({ success: false, error: 'Template content is empty or invalid' })
    }

    const payload: any = {
      manual_url: 'template_import',
      parsed_text: parsed,
      practical_title: tpl.practical_title || null,
      practical_number: tpl.practical_number ? Number(String(tpl.practical_number).trim()) : null,
      unit_code: tpl.unit_code || null,
      subject: tpl.subject || null,
      session_id: sessionId,
      updated_at: new Date().toISOString()
    }

    let writeRes
    const { data: existing, error: existErr } = await supabase
      .from('manual_templates')
      .select('id, session_id')
      .eq('session_id', sessionId)
      .maybeSingle()
    if (existErr) {
      return res.status(500).json({ success: false, error: existErr.message })
    }

    if (existing && existing.id) {
      writeRes = await supabase
        .from('manual_templates')
        .update(payload)
        .eq('session_id', sessionId)
        .select('id, session_id, parsed_text')
        .maybeSingle()
    } else {
      writeRes = await supabase
        .from('manual_templates')
        .insert(payload)
        .select('id, session_id, parsed_text')
        .maybeSingle()
    }

    if (writeRes.error) {
      return res.status(500).json({ success: false, error: writeRes.error.message })
    }
    if (!writeRes.data || !writeRes.data.session_id) {
      return res.status(500).json({ success: false, error: 'Failed to persist manual template for session' })
    }

    return res.status(200).json({ success: true, data: writeRes.data })
  } catch (err) {
    return res.status(500).json({ success: false, error: (err && err.message) || 'Server error' })
  }
})

module.exports = router
