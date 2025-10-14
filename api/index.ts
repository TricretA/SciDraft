/**
 * Vercel deploy entry handler, for serverless deployment, please don't modify this file
 */
const app = require('./app.js');

module.exports = function handler(req: any, res: any) {
  return app(req, res);
}