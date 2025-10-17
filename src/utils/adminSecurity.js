"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskSensitiveData = exports.securityLogger = exports.getSecurityHeaders = exports.loginRateLimiter = exports.isCommonPassword = exports.isValidEmailFormat = exports.sanitizeEmail = exports.isValidSessionToken = exports.generateSessionToken = exports.verifyPassword = exports.hashPassword = exports.validatePassword = exports.getRoleForEmail = exports.isValidAdminEmail = exports.PREDEFINED_ADMINS = exports.PASSWORD_RULES = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * Password validation rules for admin accounts
 */
exports.PASSWORD_RULES = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxLength: 128
};
/**
 * Predefined admin emails and their roles (matching database records)
 */
exports.PREDEFINED_ADMINS = {
    'vanessa@scidraft.com': 'Vanessa',
    'shem@scidraft.com': 'Shem',
    'wazimu@scidraft.com': 'Wazimu'
};
/**
 * Validate if email is one of the predefined admin emails
 */
const isValidAdminEmail = (email) => {
    return email in exports.PREDEFINED_ADMINS;
};
exports.isValidAdminEmail = isValidAdminEmail;
/**
 * Get role for a predefined admin email
 */
const getRoleForEmail = (email) => {
    return exports.PREDEFINED_ADMINS[email];
};
exports.getRoleForEmail = getRoleForEmail;
/**
 * Validate password strength
 */
const validatePassword = (password) => {
    const errors = [];
    if (password.length < exports.PASSWORD_RULES.minLength) {
        errors.push(`Password must be at least ${exports.PASSWORD_RULES.minLength} characters long`);
    }
    if (password.length > exports.PASSWORD_RULES.maxLength) {
        errors.push(`Password must not exceed ${exports.PASSWORD_RULES.maxLength} characters`);
    }
    if (exports.PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (exports.PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (exports.PASSWORD_RULES.requireNumbers && !/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (exports.PASSWORD_RULES.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};
exports.validatePassword = validatePassword;
/**
 * Hash password using bcrypt
 */
const hashPassword = async (password) => {
    const saltRounds = 12; // Higher salt rounds for admin passwords
    return await bcryptjs_1.default.hash(password, saltRounds);
};
exports.hashPassword = hashPassword;
/**
 * Verify password against hash
 */
const verifyPassword = async (password, hash) => {
    return await bcryptjs_1.default.compare(password, hash);
};
exports.verifyPassword = verifyPassword;
/**
 * Generate a secure session token
 */
const generateSessionToken = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};
exports.generateSessionToken = generateSessionToken;
/**
 * Validate session token format
 */
const isValidSessionToken = (token) => {
    return /^[a-f0-9]{64}$/.test(token);
};
exports.isValidSessionToken = isValidSessionToken;
/**
 * Sanitize email input
 */
const sanitizeEmail = (email) => {
    return email.toLowerCase().trim();
};
exports.sanitizeEmail = sanitizeEmail;
/**
 * Validate email format
 */
const isValidEmailFormat = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmailFormat = isValidEmailFormat;
/**
 * Check if password has been compromised (basic check)
 */
const isCommonPassword = (password) => {
    const commonPasswords = [
        'password', '123456', '123456789', 'qwerty', 'abc123',
        'password123', 'admin', 'letmein', 'welcome', 'monkey',
        '1234567890', 'password1', '123123', 'admin123'
    ];
    return commonPasswords.includes(password.toLowerCase());
};
exports.isCommonPassword = isCommonPassword;
class LoginRateLimiter {
    constructor() {
        this.attempts = new Map();
        this.maxAttempts = 5;
        this.windowMs = 15 * 60 * 1000; // 15 minutes
        this.lockoutMs = 30 * 60 * 1000; // 30 minutes
    }
    /**
     * Record a login attempt
     */
    recordAttempt(email, success) {
        const sanitizedEmail = (0, exports.sanitizeEmail)(email);
        const now = Date.now();
        if (!this.attempts.has(sanitizedEmail)) {
            this.attempts.set(sanitizedEmail, []);
        }
        const userAttempts = this.attempts.get(sanitizedEmail);
        userAttempts.push({ email: sanitizedEmail, timestamp: now, success });
        // Clean old attempts
        this.cleanOldAttempts(sanitizedEmail);
    }
    /**
     * Check if email is currently locked out
     */
    isLockedOut(email) {
        const sanitizedEmail = (0, exports.sanitizeEmail)(email);
        const userAttempts = this.attempts.get(sanitizedEmail) || [];
        const now = Date.now();
        // Clean old attempts first
        this.cleanOldAttempts(sanitizedEmail);
        const recentFailedAttempts = userAttempts.filter(attempt => !attempt.success && (now - attempt.timestamp) < this.windowMs);
        if (recentFailedAttempts.length >= this.maxAttempts) {
            const lastFailedAttempt = recentFailedAttempts[recentFailedAttempts.length - 1];
            return (now - lastFailedAttempt.timestamp) < this.lockoutMs;
        }
        return false;
    }
    /**
     * Get remaining lockout time in minutes
     */
    getRemainingLockoutTime(email) {
        const sanitizedEmail = (0, exports.sanitizeEmail)(email);
        const userAttempts = this.attempts.get(sanitizedEmail) || [];
        const now = Date.now();
        const recentFailedAttempts = userAttempts.filter(attempt => !attempt.success && (now - attempt.timestamp) < this.windowMs);
        if (recentFailedAttempts.length >= this.maxAttempts) {
            const lastFailedAttempt = recentFailedAttempts[recentFailedAttempts.length - 1];
            const lockoutEndTime = lastFailedAttempt.timestamp + this.lockoutMs;
            const remainingMs = lockoutEndTime - now;
            return Math.ceil(remainingMs / (60 * 1000)); // Convert to minutes
        }
        return 0;
    }
    /**
     * Clean old attempts outside the window
     */
    cleanOldAttempts(email) {
        const userAttempts = this.attempts.get(email);
        if (!userAttempts)
            return;
        const now = Date.now();
        const validAttempts = userAttempts.filter(attempt => (now - attempt.timestamp) < Math.max(this.windowMs, this.lockoutMs));
        if (validAttempts.length === 0) {
            this.attempts.delete(email);
        }
        else {
            this.attempts.set(email, validAttempts);
        }
    }
    /**
     * Reset attempts for an email (use after successful login)
     */
    resetAttempts(email) {
        const sanitizedEmail = (0, exports.sanitizeEmail)(email);
        this.attempts.delete(sanitizedEmail);
    }
}
// Export singleton instance
exports.loginRateLimiter = new LoginRateLimiter();
/**
 * Security headers for admin requests
 */
const getSecurityHeaders = () => {
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    };
};
exports.getSecurityHeaders = getSecurityHeaders;
class SecurityLogger {
    constructor() {
        this.events = [];
        this.maxEvents = 1000;
    }
    log(event) {
        const securityEvent = {
            ...event,
            timestamp: Date.now()
        };
        this.events.push(securityEvent);
        // Keep only recent events
        if (this.events.length > this.maxEvents) {
            this.events = this.events.slice(-this.maxEvents);
        }
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log('Security Event:', securityEvent);
        }
    }
    getEvents(type, limit = 100) {
        let filteredEvents = this.events;
        if (type) {
            filteredEvents = filteredEvents.filter(event => event.type === type);
        }
        return filteredEvents.slice(-limit).reverse();
    }
    getFailedLoginAttempts(email, hours = 24) {
        const cutoff = Date.now() - (hours * 60 * 60 * 1000);
        return this.events.filter(event => event.type === 'login_failure' &&
            event.timestamp > cutoff &&
            (!email || event.email === email));
    }
}
// Export singleton instance
exports.securityLogger = new SecurityLogger();
/**
 * Utility to mask sensitive data in logs
 */
const maskSensitiveData = (data) => {
    if (typeof data !== 'object' || data === null) {
        return data;
    }
    const masked = { ...data };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'hash'];
    for (const field of sensitiveFields) {
        if (field in masked) {
            masked[field] = '***MASKED***';
        }
    }
    return masked;
};
exports.maskSensitiveData = maskSensitiveData;
