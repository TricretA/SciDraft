// Test environment variables
console.log('Environment variables test:');
console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    env: {
      geminiApiKey: !!process.env.GEMINI_API_KEY,
      supabaseUrl: !!process.env.SUPABASE_URL,
      supabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  });
});

module.exports = router;