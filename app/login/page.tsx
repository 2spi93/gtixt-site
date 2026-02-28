'use client';

export const dynamic = 'force-dynamic';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpRequired, setTotpRequired] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body: any = { username, password };
      if (totpRequired && totpCode) {
        body.totp = totpCode;
      }

      const res = await fetch('/api/internal/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ✓ Sends cookies, receives Set-Cookie
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Check if TOTP is required
      if (data.requires_totp && !totpRequired) {
        setTotpRequired(true);
        setLoading(false);
        return;
      }

      // No need to store token - it's set as httpOnly cookie by API
      // Authentication is now cookie-based, not sessionStorage-based

      // Check if password is expired - redirect to change password
      if (data.password_expired) {
        // Small delay to ensure cookie is set
        setTimeout(() => {
          router.push('/admin/security/password/');
        }, 100);
        return;
      }

      // Redirect to dashboard (cookie auth handled automatically)
      setTimeout(() => {
        router.push('/admin/');
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 bg-grid opacity-5"></div>
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-blue-500/20 via-transparent to-transparent blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-radial from-cyan-500/20 via-transparent to-transparent blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-purple-500/10 via-transparent to-transparent blur-3xl animate-pulse"></div>

      {/* Login Card */}
      <Card className="w-full max-w-md relative z-10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border-2 border-cyan-400/30 shadow-2xl shadow-cyan-500/20">
        {/* GTIXT Brand Mark */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-xl shadow-cyan-500/50 flex items-center justify-center relative overflow-hidden border-2 border-cyan-400/50">
            <div className="absolute inset-0 bg-grid opacity-10"></div>
            <div className="relative z-10 flex items-center justify-center">
              <span className="text-4xl font-black text-white">GT</span>
            </div>
            <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-lg shadow-cyan-400/80"></div>
          </div>
        </div>

        <div className="p-8 pt-16">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-white bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">GTIXT Admin</h1>
            <p className="text-cyan-400/80 mt-2 font-medium">Secure Control Console</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border-l-4 border-red-500 p-4 rounded-xl backdrop-blur-sm border border-red-400/30 shadow-lg shadow-red-500/20">
                <p className="text-red-300 text-sm font-bold">⚠️ {error}</p>
              </div>
            )}

            {/* TOTP Required Message */}
            {totpRequired && (
              <div className="bg-blue-500/20 border-l-4 border-blue-500 p-4 rounded-xl backdrop-blur-sm border border-blue-400/30 shadow-lg shadow-blue-500/20">
                <p className="text-blue-300 text-sm font-bold">🔐 Two-factor authentication required</p>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label className="block text-sm font-bold text-cyan-400 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus={!totpRequired}
                disabled={loading || totpRequired}
                className="w-full px-5 py-4 bg-white/10 border border-cyan-400/30 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/60 backdrop-blur-sm transition shadow-lg shadow-cyan-500/10 focus:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                placeholder="Enter your username"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-bold text-cyan-400 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || totpRequired}
                className="w-full px-5 py-4 bg-white/10 border border-cyan-400/30 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/60 backdrop-blur-sm transition shadow-lg shadow-cyan-500/10 focus:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                placeholder="••••••••"
              />
            </div>

            {/* TOTP Code Field */}
            {totpRequired && (
              <div>
                <label className="block text-sm font-bold text-cyan-400 mb-2">
                  🔐 Two-Factor Code
                </label>
                <input
                  type="text"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  autoFocus
                  disabled={loading}
                  className="w-full px-5 py-4 bg-white/10 border border-cyan-400/30 rounded-xl text-white placeholder-white/40 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/60 backdrop-blur-sm transition shadow-lg shadow-cyan-500/10 focus:shadow-cyan-500/30 text-center text-2xl tracking-widest font-mono font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="000000"
                  maxLength={6}
                  pattern="[0-9]{6}"
                />
                <p className="text-xs text-white/50 mt-2 text-center font-medium">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:from-gray-500 disabled:to-gray-600 text-white font-black py-4 rounded-xl transition shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-500/60 disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed text-lg border border-cyan-400/50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Authenticating...
                </span>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <a href="/forgot-password" className="text-sm text-cyan-400 hover:text-cyan-300 font-bold transition">
                Forgot your password?
              </a>
            </div>
          </form>

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-white/50">
            <p className="font-bold">🔒 Secure Admin Access • All logins are monitored</p>
            <p className="mt-1">2FA Required for privileged operations</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
