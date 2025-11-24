/**
 * Vercel serverless entry - routes /api/* to the Express app
 */
const app = require('./app.js');

module.exports = function handler(req, res) {
  return app(req, res);
}
