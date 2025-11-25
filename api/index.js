/**
 * Vercel serverless entry - routes /api/* to the Express app
 */
const app = require('../server/app.js');

module.exports = function handler(req, res) {
  try {
    if (req.url && req.url.startsWith('/api')) {
      req.url = req.url.replace(/^\/api/, '');
    }
    return app(req, res);
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ success: false, error: 'Server error' }));
  }
}
