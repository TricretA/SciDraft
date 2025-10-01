import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Eye, EyeOff, Shield, LogIn } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

interface LocationState {
  message?: string;
}

const AdminLogin: React.FC = () => {
  const { login } = useAdminAuth();
  const location = useLocation();
  const state = location.state as LocationState;
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Show success message from signup
  useEffect(() => {
    if (state?.message) {
      setSuccessMessage(state.message);
      // Clear the message after 5 seconds
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Call the admin authentication API
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const result = await response.json();

      if (result.success && result.admin) {
        // Use AdminAuthContext login method with admin data
        await login(result.admin);
        // AdminAuthContext will handle the redirection
      } else {
        setErrors({ general: result.error || 'Invalid email or password' });
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-md">
        {/* Glassmorphism Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Login</h1>
            <p className="text-blue-200">Access your SciDraft admin panel</p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-green-200 text-sm">
              {successMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error */}
            {errors.general && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-200 text-sm">
                {errors.general}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Admin Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 transition-all ${
                  errors.email 
                    ? 'border-red-500/50 focus:ring-red-500/50' 
                    : 'border-white/20 focus:ring-blue-500/50'
                }`}
                placeholder="Enter your admin email"
                autoComplete="email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full px-4 py-3 pr-12 bg-white/10 border rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 transition-all ${
                    errors.password 
                      ? 'border-red-500/50 focus:ring-red-500/50' 
                      : 'border-white/20 focus:ring-blue-500/50'
                  }`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-blue-200 text-sm">
              Secure admin access for authorized personnel only
            </p>
          </div>

          {/* Security Notice */}
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-200 text-xs text-center">
              🔒 This is a secure admin area. All activities are logged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;