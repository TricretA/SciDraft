const express = require('express')
const { supabase } = require('../../lib/server/supabase.cjs')

const router = express.Router()

async function ensureBucket(bucket) {
  try {
    const { data: buckets } = await supabase.storage.listBuckets()
    const exists = (buckets || []).some(b => b.name === bucket)
    if (!exists) await supabase.storage.createBucket(bucket, { public: true })
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
      if (upload.error) return res.status(500).json({ success: false, error: upload.error.message })
      const pub = supabase.storage.from('manuals').getPublicUrl(filePath)
      manualUrl = (pub && pub.data && pub.data.publicUrl) || filePath
    }

    const insert = await supabase
      .from('manual_templates')
      .insert({
        manual_url: manualUrl,
        parsed_text: manualContent,
        uploaded_by: null,
        practical_title: String(practicalTitle).trim(),
        practical_number: Number(practicalNumber),
        unit_code: String(unitName).trim() || 'UNKNOWN',
        subject
      })
      .select()
    if (insert.error) return res.status(500).json({ success: false, error: insert.error.message })
    return res.status(200).json({ success: true, data: insert.data && insert.data[0], manualUrl })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Server error' })
  }
})

module.exports = router

