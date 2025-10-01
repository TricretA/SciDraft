import bcrypt from 'bcryptjs';

/**
 * Password validation rules for admin accounts
 */
export const PASSWORD_RULES = {
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
export const PREDEFINED_ADMINS = {
  'vanessa@scidraft.com': 'Vanessa',
  'shem@scidraft.com': 'Shem',
  'wazimu@scidraft.com': 'Wazimu'
} as const;

export type PredefinedAdminEmail = keyof typeof PREDEFINED_ADMINS;
export type AdminRole = typeof PREDEFINED_ADMINS[PredefinedAdminEmail];

/**
 * Validate if email is one of the predefined admin emails
 */
export const isValidAdminEmail = (email: string): email is PredefinedAdminEmail => {
  return email in PREDEFINED_ADMINS;
};

/**
 * Get role for a predefined admin email
 */
export const getRoleForEmail = (email: PredefinedAdminEmail): AdminRole => {
  return PREDEFINED_ADMINS[email];
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(`Password must be at least ${PASSWORD_RULES.minLength} characters long`);
  }

  if (password.length > PASSWORD_RULES.maxLength) {
    errors.push(`Password must not exceed ${PASSWORD_RULES.maxLength} characters`);
  }

  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_RULES.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (PASSWORD_RULES.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12; // Higher salt rounds for admin passwords
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Verify password against hash
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate a secure session token
 */
export const generateSessionToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Validate session token format
 */
export const isValidSessionToken = (token: string): boolean => {
  return /^[a-f0-9]{64}$/.test(token);
};

/**
 * Sanitize email input
 */
export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

/**
 * Validate email format
 */
export const isValidEmailFormat = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if password has been compromised (basic check)
 */
export const isCommonPassword = (password: string): boolean => {
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey',
    '1234567890', 'password1', '123123', 'admin123'
  ];
  
  return commonPasswords.includes(password.toLowerCase());
};

/**
 * Rate limiting helper for login attempts
 */
interface LoginAttempt {
  email: string;
  timestamp: number;
  success: boolean;
}

class LoginRateLimiter {
  private attempts: Map<string, LoginAttempt[]> = new Map();
  private readonly maxAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes
  private readonly lockoutMs = 30 * 60 * 1000; // 30 minutes

  /**
   * Record a login attempt
   */
  recordAttempt(email: string, success: boolean): void {
    const sanitizedEmail = sanitizeEmail(email);
    const now = Date.now();
    
    if (!this.attempts.has(sanitizedEmail)) {
      this.attempts.set(sanitizedEmail, []);
    }
    
    const userAttempts = this.attempts.get(sanitizedEmail)!;
    userAttempts.push({ email: sanitizedEmail, timestamp: now, success });
    
    // Clean old attempts
    this.cleanOldAttempts(sanitizedEmail);
  }

  /**
   * Check if email is currently locked out
   */
  isLockedOut(email: string): boolean {
    const sanitizedEmail = sanitizeEmail(email);
    const userAttempts = this.attempts.get(sanitizedEmail) || [];
    const now = Date.now();
    
    // Clean old attempts first
    this.cleanOldAttempts(sanitizedEmail);
    
    const recentFailedAttempts = userAttempts.filter(
      attempt => !attempt.success && (now - attempt.timestamp) < this.windowMs
    );
    
    if (recentFailedAttempts.length >= this.maxAttempts) {
      const lastFailedAttempt = recentFailedAttempts[recentFailedAttempts.length - 1];
      return (now - lastFailedAttempt.timestamp) < this.lockoutMs;
    }
    
    return false;
  }

  /**
   * Get remaining lockout time in minutes
   */
  getRemainingLockoutTime(email: string): number {
    const sanitizedEmail = sanitizeEmail(email);
    const userAttempts = this.attempts.get(sanitizedEmail) || [];
    const now = Date.now();
    
    const recentFailedAttempts = userAttempts.filter(
      attempt => !attempt.success && (now - attempt.timestamp) < this.windowMs
    );
    
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
  private cleanOldAttempts(email: string): void {
    const userAttempts = this.attempts.get(email);
    if (!userAttempts) return;
    
    const now = Date.now();
    const validAttempts = userAttempts.filter(
      attempt => (now - attempt.timestamp) < Math.max(this.windowMs, this.lockoutMs)
    );
    
    if (validAttempts.length === 0) {
      this.attempts.delete(email);
    } else {
      this.attempts.set(email, validAttempts);
    }
  }

  /**
   * Reset attempts for an email (use after successful login)
   */
  resetAttempts(email: string): void {
    const sanitizedEmail = sanitizeEmail(email);
    this.attempts.delete(sanitizedEmail);
  }
}

// Export singleton instance
export const loginRateLimiter = new LoginRateLimiter();

/**
 * Security headers for admin requests
 */
export const getSecurityHeaders = (): Record<string, string> => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  };
};

/**
 * Log security events
 */
export interface SecurityEvent {
  type: 'login_success' | 'login_failure' | 'logout' | 'permission_denied' | 'suspicious_activity';
  email: string;
  ip?: string;
  userAgent?: string;
  timestamp: number;
  details?: Record<string, any>;
}

class SecurityLogger {
  private events: SecurityEvent[] = [];
  private readonly maxEvents = 1000;

  log(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
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

  getEvents(type?: SecurityEvent['type'], limit = 100): SecurityEvent[] {
    let filteredEvents = this.events;
    
    if (type) {
      filteredEvents = filteredEvents.filter(event => event.type === type);
    }
    
    return filteredEvents.slice(-limit).reverse();
  }

  getFailedLoginAttempts(email?: string, hours = 24): SecurityEvent[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    
    return this.events.filter(event => 
      event.type === 'login_failure' &&
      event.timestamp > cutoff &&
      (!email || event.email === email)
    );
  }
}

// Export singleton instance
export const securityLogger = new SecurityLogger();

/**
 * Utility to mask sensitive data in logs
 */
export const maskSensitiveData = (data: any): any => {
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