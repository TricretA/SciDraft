/**
 * This is a API server
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRouter = require('./routes/auth.js');
const adminAuthRouter = require('./routes/adminAuth.js');
const generateDraftRouter = require('./generate-draft.js');
const generateFullReportRouter = require('./generate-full-report.js');
const testEnvRouter = require('./test-env.js');


const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/**
 * API Routes
 */
app.use('/api/auth', authRouter);
app.use('/api/admin/auth', adminAuthRouter);
app.use('/api/generate-draft', generateDraftRouter);
app.use('/api/generate-full-report', generateFullReportRouter);
app.use('/api/test-env', testEnvRouter);

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