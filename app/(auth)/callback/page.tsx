"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Loader2, CheckCircle, XCircle, Lock } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'set-password' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // Password form states
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [settingPassword, setSettingPassword] = useState(false);

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      // Get hash parameters from URL
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');
      const error = hashParams.get('error');
      const errorDescription = hashParams.get('error_description');

      console.log('Auth callback:', { type, hasToken: !!accessToken, error });

      // Handle errors in URL
      if (error) {
        throw new Error(errorDescription || error);
      }

      if (!accessToken) {
        throw new Error('No access token found in URL');
      }

      // Set the session with the tokens
      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });

      if (sessionError) throw sessionError;

      if (data.user) {
        console.log('User authenticated:', data.user.email);
        setUserEmail(data.user.email || null);

        // Check if this is an invite (needs password setup)
        if (type === 'invite') {
          setMessage('Email verified! Please set your password.');
          setStatus('set-password');
        } 
        // Check if this is a recovery (password reset)
        else if (type === 'recovery') {
          setMessage('Password reset verified! Please set your new password.');
          setStatus('set-password');
        }
        // Regular email verification - redirect to dashboard
        else {
          setMessage('Email verified successfully!');
          setStatus('success');
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        }
      } else {
        throw new Error('No user data received');
      }
    } catch (err) {
      console.error('Auth callback error:', err);
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to verify email');
    }
  };

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(pwd)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(pwd)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(pwd)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  const handleSetPassword = async () => {
    setPasswordError("");

    // Validate password
    const validation = validatePassword(password);
    if (validation) {
      setPasswordError(validation);
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setSettingPassword(true);

    try {
      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setMessage('Password set successfully!');
      setStatus('success');
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('Error setting password:', err);
      setPasswordError(err instanceof Error ? err.message : 'Failed to set password');
    } finally {
      setSettingPassword(false);
    }
  };

  // Loading State
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying Email
            </h2>
            <p className="text-gray-600">{message}</p>
          </div>
        </div>
      </div>
    );
  }

  // Set Password State
  if (status === 'set-password') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="flex justify-center mb-6">
              <div className="bg-blue-100 p-3 rounded-full">
                <Lock className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h2 className="text-center text-3xl font-extrabold text-gray-900">
              Set Your Password
            </h2>
            {userEmail && (
              <p className="mt-2 text-center text-sm text-gray-600">
                Welcome, {userEmail}
              </p>
            )}
            <p className="mt-1 text-center text-sm text-gray-500">
              Please create a strong password for your account
            </p>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-8 space-y-6">
            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {passwordError}
              </div>
            )}

            <div className="space-y-4">
              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                />
              </div>

              {/* Confirm Password Input */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSetPassword()}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm your password"
                />
              </div>

              {/* Show/Hide Password Toggle */}
              <div className="flex items-center">
                <input
                  id="show-password"
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="show-password" className="ml-2 block text-sm text-gray-700">
                  Show password
                </label>
              </div>

              {/* Password Requirements */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-medium text-blue-900 mb-2">Password Requirements:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li className={password.length >= 8 ? "text-green-600 font-medium" : ""}>
                    • At least 8 characters
                  </li>
                  <li className={/[A-Z]/.test(password) ? "text-green-600 font-medium" : ""}>
                    • One uppercase letter
                  </li>
                  <li className={/[a-z]/.test(password) ? "text-green-600 font-medium" : ""}>
                    • One lowercase letter
                  </li>
                  <li className={/[0-9]/.test(password) ? "text-green-600 font-medium" : ""}>
                    • One number
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={handleSetPassword}
              disabled={settingPassword || !password || !confirmPassword}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {settingPassword ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Setting Password...
                </>
              ) : (
                'Set Password & Continue'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success State
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Success!
            </h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500 mt-2">Redirecting...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verification Failed
          </h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}
