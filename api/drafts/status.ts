const express = require('express')
const { supabase } = require('../lib/supabase')

const router = express.Router()

router.get('/status', async (req, res) => {
  try {
    const sessionId = req.query.sessionId
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ success: false, error: 'sessionId is required' })
    }

    const { data, error } = await supabase
      .from('drafts')
      .select('*')
      .eq('session_id', sessionId)
      .limit(1)
      .maybeSingle()

    if (error) {
      return res.status(500).json({ success: false, error: error.message })
    }
    if (!data) {
      return res.status(404).json({ success: false, error: 'Draft not found yet' })
    }
    return res.status(200).json({ success: true, data })
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Server error' })
  }
})

module.exports = router

