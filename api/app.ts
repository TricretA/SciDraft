/**
 * This is a API server
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
try {
  // Try loading env from API directory first
  require('dotenv').config({ path: path.join(__dirname, '.env') });
  // Also attempt root .env as fallback
  require('dotenv').config();
} catch {}

const generateDraftRouter = require('./generate-draft.ts');
const generateFullReportRouter = require('./generate-full-report.js');
const uploadManualRouter = require('./manuals/upload.ts');
const uploadDrawingRouter = require('./storage/upload-drawing.ts');
const draftStatusRouter = require('./drafts/status.ts');
const draftViewRouter = require('./drafts/view.ts');
const templatesRouter = require('./templates/list.ts');
const paymentsRouter = require('./payments/mpesa.ts');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// Prevent conditional GET 304 for dynamic JSON endpoints
app.disable('etag');
const noCache = (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
};

/**
 * API Routes
 */
app.use('/api/generate-draft', generateDraftRouter);
app.use('/api/generate-full-report', generateFullReportRouter);
app.use('/api/manuals', uploadManualRouter);
app.use('/api/storage', uploadDrawingRouter);
app.use('/api/drafts', draftStatusRouter);
app.use('/api/drafts', draftViewRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/payments', noCache, paymentsRouter);


/**
 * health
 */
app.use('/api/health', (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'ok'
  });
});

/**
 * error handler middleware
 */
app.use((error, req, res, next) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error'
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'API not found'
  });
});

module.exports = app;
