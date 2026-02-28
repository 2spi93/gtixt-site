'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams?.get('returnTo') || '/admin';
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'login' | 'totp'>('login');

  useEffect(() => {
    // Note: Authentication is now handled via httpOnly cookie set by server
    // Middleware will check cookie and allow/deny access automatically
    // No client-side sessionStorage token needed
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (step === 'login') {
        // First step: authenticate with username/password
        const res = await fetch('/api/internal/auth/login/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
          credentials: 'include',
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: 'Request failed' }));
          setError(data.error || 'Login failed');
          setLoading(false);
          return;
        }

        const data = await res.json();
        
        if (data.requires_totp) {
          // Need TOTP - token is set in cookie, proceed to TOTP step
          setStep('totp');
          setLoading(false);
          return;
        }

        // No TOTP required, token is in httpOnly cookie, redirect
        if (data.user && data.user.id) {
          // Wait a moment for cookie to be fully set, then redirect
          await new Promise(resolve => setTimeout(resolve, 500));
          router.replace(returnTo);
        } else {
          setError('Invalid response from server');
          setLoading(false);
        }
      } else {
        // Second step: verify TOTP - re-submit login with TOTP code
        const res = await fetch('/api/internal/auth/login/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, totp }),
          credentials: 'include',
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: 'Request failed' }));
          setError(data.error || 'TOTP verification failed');
          setLoading(false);
          return;
        }

        const data = await res.json();
        if (data.user && data.user.id) {
          // Wait a moment for cookie to be fully set, then redirect
          await new Promise(resolve => setTimeout(resolve, 500));
          router.replace(returnTo);
        } else {
          setError('Invalid response from server');
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg mb-4">
              <span className="text-xl font-bold text-white">GT</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
            <p className="text-slate-400 text-sm mt-1">Secure Access Required</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-2 rounded text-sm">
                {error}
              </div>
            )}

            {step === 'login' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Two-Factor Authentication Code
                </label>
                <input
                  type="text"
                  value={totp}
                  onChange={(e) => setTotp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-center text-2xl tracking-widest"
                  required
                />
                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="text-sm text-cyan-400 hover:text-cyan-300 mt-2"
                >
                  Back
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 rounded transition"
            >
              {loading ? 'Please wait...' : step === 'login' ? 'Sign In' : 'Verify'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-slate-400 text-xs text-center mt-6">
            This is a secure area. Only authorized personnel may access.
          </p>
        </div>
      </div>
    </div>
  );
}
