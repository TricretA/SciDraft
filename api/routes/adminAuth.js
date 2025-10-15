const express = require('express');
const { supabase } = require('../lib/supabase.js');
const { isValidAdminEmail, sanitizeEmail } = require('../utils/adminSecurity.js');
const bcrypt = require('bcryptjs');

const router = express.Router();



// Admin authentication endpoint
router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    // Sanitize email
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    // Check if email is valid admin email
    if (!isValidAdminEmail(sanitizedEmail)) {
      return res.status(200).json({ success: false, error: 'Invalid credentials' });
    }

    // Query admin directly from database
    const { data: admin, error: dbError } = await supabase
      .from('admins')
      .select('id, name, email, role, password_hash')
      .eq('email', sanitizedEmail)
      .single();

    if (dbError || !admin) {
      console.log('Admin not found or database error:', dbError);
      return res.status(200).json({ success: false, error: 'Invalid credentials' });
    }

    // Verify password using bcrypt
    if (!admin.password_hash) {
      console.log('No password hash found for admin');
      return res.status(200).json({ success: false, error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    
    if (!isPasswordValid) {
      console.log('Invalid password for admin:', sanitizedEmail);
      return res.status(200).json({ success: false, error: 'Invalid credentials' });
    }

    // Password is valid, create admin session
    const adminData = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      loginTime: new Date().toISOString()
    };

    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    return res.status(200).json({
      success: true,
      admin: adminData
    });

  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Check admins endpoint for debugging
router.get('/check-admins', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('id, name, email, role, created_at')
      .limit(10);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ success: false, error: 'Database error' });
    }

    return res.status(200).json({
      success: true,
      admins: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Check admins error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;