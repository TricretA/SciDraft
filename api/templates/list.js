const express = require('express')
const { supabase } = require('../lib/supabase')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { q = '', year = '', page = '1', pageSize = '12' } = req.query || {}
    console.log('[templates] request', { q, year, page, pageSize })
    const from = (Number(page) - 1) * Number(pageSize)
    const to = from + Number(pageSize) - 1

    let query = supabase
      .from('admin_manual_templates')
      .select('id, created_at, unit_name, unit_code, practical_title, practical_number, year, subject, practical_content', { count: 'exact' })

    if (q && String(q).trim()) {
      const like = `%${String(q).trim()}%`
      query = query.or(`practical_title.ilike.${like},unit_name.ilike.${like},unit_code.ilike.${like}`)
    }
    if (year && String(year).trim()) {
      query = query.eq('year', String(year).trim())
    }

    const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to)
    if (error) {
      console.error('[templates] supabase error', error)
      return res.status(500).json({ success: false, error: error.message })
    }

    console.log('[templates] response', { count })
    return res.status(200).json({ success: true, data: data || [], total: count || 0 })
  } catch (err) {
    const message = (err && err.message) ? err.message : 'Server error'
    console.error('[templates] handler error', message)
    return res.status(500).json({ success: false, error: message })
  }
})

module.exports = router
