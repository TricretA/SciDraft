/**
 * Vercel deploy entry handler, for serverless deployment, please don't modify this file
 */
const app = require('./app.js');

module.exports = function handler(req, res) {
  return app(req, res);
}