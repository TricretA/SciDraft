/**
 * Admin security utilities for API (CommonJS version)
 * Based on src/utils/adminSecurity.ts but converted to CommonJS
 */

const bcrypt = require('bcryptjs');

/**
 * Predefined admin emails and their roles (matching database records)
 */
const PREDEFINED_ADMINS = {
  'vanessa@scidraft.com': 'Vanessa',
  'shem@scidraft.com': 'Shem',
  'wazimu@scidraft.com': 'Wazimu'
};

/**
 * Validate if email is one of the predefined admin emails
 */
const isValidAdminEmail = (email) => {
  return email in PREDEFINED_ADMINS;
};

/**
 * Sanitize email input
 */
const sanitizeEmail = (email) => {
  return email.toLowerCase().trim();
};

/**
 * Validate email format
 */
const isValidEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Hash password using bcrypt
 */
const hashPassword = async (password) => {
  const saltRounds = 12; // Higher salt rounds for admin passwords
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Verify password against hash
 */
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

module.exports = {
  PREDEFINED_ADMINS,
  isValidAdminEmail,
  sanitizeEmail,
  isValidEmailFormat,
  hashPassword,
  verifyPassword
};