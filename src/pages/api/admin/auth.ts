import { Request, Response } from 'express';
import { supabase } from '../../../lib/supabase';
import { isValidAdminEmail, getRoleForEmail, sanitizeEmail } from '../../../utils/adminSecurity';
import { applySecurityHeaders } from '../../../utils/secureCookies';

interface AdminLoginRequest {
  email: string;
  password: string;
}

interface AdminLoginResponse {
  success: boolean;
  admin?: {
    id: string;
    email: string;
    role: string;
    fullName: string;
    loginTime: string;
  };
  error?: string;
}

export default async function handler(
  req: Request,
  res: Response<AdminLoginResponse>
) {
  // Apply security headers
  applySecurityHeaders(res);

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, password }: AdminLoginRequest = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email);

    // Check if email is a valid admin email
    if (!isValidAdminEmail(sanitizedEmail)) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    // Use the database function to verify admin login
    const { data: adminData, error: dbError } = await supabase
      .rpc('verify_admin_login', {
        input_email: sanitizedEmail,
        input_password: password
      });

    if (dbError) {
      console.error('Database error during admin login:', dbError);
      return res.status(500).json({ 
        success: false, 
        error: 'Authentication failed' 
      });
    }

    // Check if admin was found and authenticated
    if (!adminData || adminData.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    const admin = adminData[0];
    const loginTime = new Date().toISOString();

    // Return successful authentication
    return res.status(200).json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        fullName: admin.name,
        loginTime
      }
    });

  } catch (error) {
    console.error('Admin authentication error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}