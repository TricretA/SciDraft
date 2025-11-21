/**
 * This is a API server
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const generateDraftRouter = require('./generate-draft.ts');
const generateFullReportRouter = require('./generate-full-report.js');
const uploadManualRouter = require('./manuals/upload.ts');
const uploadDrawingRouter = require('./storage/upload-drawing.ts');
const draftStatusRouter = require('./drafts/status.ts');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/**
 * API Routes
 */
app.use('/api/generate-draft', generateDraftRouter);
app.use('/api/generate-full-report', generateFullReportRouter);
app.use('/api/manuals', uploadManualRouter);
app.use('/api/storage', uploadDrawingRouter);
app.use('/api/drafts', draftStatusRouter);


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
