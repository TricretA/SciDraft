const express = require('express')
const { supabase } = require('../lib/server/supabase.cjs')

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    const sessionId = String((req.body && req.body.sessionId) || '')
    if (!sessionId) return res.status(400).json({ success: false, error: 'sessionId required' })
    const { data, error } = await supabase
      .from('drafts')
      .update({ status: 'complete' })
      .eq('session_id', sessionId)
      .select('*')
      .maybeSingle()
    if (error) return res.status(500).json({ success: false, error: error.message })
    return res.status(200).json({ success: true, sessionId, data })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Server error' })
  }
})

module.exports = router

