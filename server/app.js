/**
 * This is a API server
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
try {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
  require('dotenv').config();
} catch {}

const templatesRouter = require('./templates/list.js');
// NOTE: Other routers disabled to avoid TS runtime issues during current fix

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.disable('etag');
const noCache = (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
};

app.use('/templates', templatesRouter);

app.use('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'ok' });
});

app.use((error, req, res, next) => {
  res.status(500).json({ success: false, error: 'Server internal error' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'API not found' });
});

module.exports = app;
