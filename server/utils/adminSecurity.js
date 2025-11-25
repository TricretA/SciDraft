const bcrypt = require('bcryptjs')

const PREDEFINED_ADMINS = {
  'vanessa@scidraft.com': 'Vanessa',
  'shem@scidraft.com': 'Shem',
  'wazimu@scidraft.com': 'Wazimu'
}

const isValidAdminEmail = (email) => email in PREDEFINED_ADMINS

const sanitizeEmail = (email) => email.toLowerCase().trim()

const isValidEmailFormat = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const hashPassword = async (password) => bcrypt.hash(password, 12)

const verifyPassword = async (password, hash) => bcrypt.compare(password, hash)

module.exports = {
  PREDEFINED_ADMINS,
  isValidAdminEmail,
  sanitizeEmail,
  isValidEmailFormat,
  hashPassword,
  verifyPassword
}

