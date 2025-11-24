const { supabase } = require('./lib/supabase.js')

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ success: false, error: 'Method not allowed' })
      return
    }

    const q = (req.query && req.query.q) || ''
    const year = (req.query && req.query.year) || ''
    const page = Number((req.query && req.query.page) || '1')
    const pageSize = Number((req.query && req.query.pageSize) || '12')

    console.log('[templates.fn] request', { q, year, page, pageSize })

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('admin_manual_templates')
      .select(
        'id, created_at, unit_name, unit_code, practical_title, practical_number, year, subject, practical_content',
        { count: 'exact' }
      )

    if (q && String(q).trim()) {
      const like = `%${String(q).trim()}%`
      query = query.or(`practical_title.ilike.${like},unit_name.ilike.${like},unit_code.ilike.${like}`)
    }
    if (year && String(year).trim()) {
      query = query.eq('year', String(year).trim())
    }

    const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to)
    if (error) {
      console.error('[templates.fn] supabase error', error)
      res.status(500).json({ success: false, error: error.message })
      return
    }

    console.log('[templates.fn] response', { count })
    res.status(200).json({ success: true, data: data || [], total: count || 0 })
  } catch (err) {
    const message = (err && err.message) ? err.message : 'Server error'
    console.error('[templates.fn] handler error', message)
    res.status(500).json({ success: false, error: message })
  }
}
