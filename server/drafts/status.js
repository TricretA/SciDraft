const express = require('express')
const { supabase } = require('../../lib/server/supabase.cjs')

const router = express.Router()

router.get('/status', async (req, res) => {
  try {
    const sessionId = String(req.query.sessionId || '')
    if (!sessionId) return res.status(400).json({ success: false, error: 'sessionId required' })
    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('session_id', sessionId)
      .limit(1)
      .maybeSingle()
    if (error) return res.status(500).json({ success: false, error: error.message })
    if (!data) return res.status(404).json({ success: false, error: 'Draft not found' })
    return res.status(200).json({ success: true, data })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Server error' })
  }
})

module.exports = router

