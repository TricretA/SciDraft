/**
 * Vercel serverless entry - single function that routes /api/* to the Express app
 */

const app = require('../server/app.cjs');

module.exports = function handler(req, res) {
  // Some Vercel rewrites may pass the request with the /api prefix stripped,
  // or sometimes they preserve it. Be defensive: normalize to remove a leading
  // /api from req.url so routes mounted at /templates or /api/templates still work.
  try {
    // Save original for debugging if needed
    req._originalUrl = req.url;

    // If req.url starts with /api, remove it to make routing consistent.
    // This allows the Express app to mount routers at '/templates' (recommended),
    // or at '/api/templates' (still works if req.url kept), but we normalize.
    if (typeof req.url === 'string' && req.url.startsWith('/api')) {
      req.url = req.url.replace(/^\/api/, '') || '/';
    }
  } catch (e) {
    // swallow - we still want to call the app
  }

  return app(req, res);
};
