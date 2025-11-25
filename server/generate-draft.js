const express = require('express')
const { supabase } = require('../lib/server/supabase.cjs')

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    const body = req.body || {}
    const sessionId = String(body.sessionId || '')
    if (!sessionId) return res.status(400).json({ success: false, error: 'sessionId required' })

    const placeholder = {
      title: 'Research Report Draft',
      introduction: '[STUDENT INPUT REQUIRED]',
      objectives: '[STUDENT INPUT REQUIRED]',
      materials: '[STUDENT INPUT REQUIRED]',
      procedures: '[STUDENT INPUT REQUIRED]',
      results: '[STUDENT INPUT REQUIRED]',
      discussion: '[STUDENT INPUT REQUIRED]',
      conclusion: '[STUDENT INPUT REQUIRED]',
      references: '[SUGGESTED_REFERENCE - STUDENT INPUT REQUIRED]'
    }

    const upsert = await supabase
      .from('drafts')
      .upsert({ session_id: sessionId, status: 'complete', draft: placeholder }, { onConflict: 'session_id' })
      .select('*')
      .maybeSingle()

    if (upsert.error) {
      return res.status(500).json({ success: false, error: upsert.error.message })
    }

    return res.status(200).json({ success: true, sessionId })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Server error' })
  }
})

module.exports = router

