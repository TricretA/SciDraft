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
    const { file } = req.body || {}
    if (!file || !file.base64 || !file.name) return res.status(400).json({ success: false, error: 'Missing file payload' })
    await ensureBucket('drawings')
    const filePath = `${Date.now()}-${file.name}`
    const buffer = Buffer.from(file.base64, 'base64')
    const upload = await supabase.storage.from('drawings').upload(filePath, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false
    })
    if (upload.error) return res.status(500).json({ success: false, error: upload.error.message })
    const pub = supabase.storage.from('drawings').getPublicUrl(filePath)
    const publicUrl = (pub && pub.data && pub.data.publicUrl) || filePath
    return res.status(200).json({ success: true, url: publicUrl, path: filePath })
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Server error' })
  }
})

module.exports = router

