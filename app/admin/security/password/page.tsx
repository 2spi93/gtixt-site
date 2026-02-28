'use client';

export const dynamic = 'force-dynamic';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Authentication is handled by middleware via auth_token cookie
    // No need to check sessionStorage - if user reached this page, they're authenticated
  }, []);

  useEffect(() => {
    // Calculate password strength
    if (!newPassword) {
      setPasswordStrength(0);
      return;
    }
    let strength = 0;
    if (newPassword.length >= 12) strength += 25;
    if (newPassword.length >= 16) strength += 15;
    if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) strength += 25;
    if (/[0-9]/.test(newPassword)) strength += 20;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) strength += 15;
    setPasswordStrength(Math.min(strength, 100));
  }, [newPassword]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 12) {
      setError('Password must be at least 12 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/internal/auth/change-password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const payload = await res.json();

      if (!res.ok) {
        const details = Array.isArray(payload?.details) ? payload.details.join(' ') : '';
        throw new Error(payload?.error || details || 'Password change failed');
      }

      setSuccess('✅ Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      const returnTo = searchParams?.get('returnTo') || '/admin/';
      setTimeout(() => router.push(returnTo), 1500);
    } catch (err: any) {
      setError(err?.message || 'Password change failed');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength < 40) return 'bg-red-500';
    if (passwordStrength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 70) return 'Medium';
    return 'Strong';
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">🔑 Change Password</h1>
      
      <div className="max-w-2xl">
        <Card className="p-8">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-700">⚠️ {error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <p className="text-green-700">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <input 
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your current password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input 
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter new password"
              />
              {newPassword && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${getStrengthColor()}`}
                        style={{ width: `${passwordStrength}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium">{getStrengthText()}</span>
                  </div>
                  <p className="text-xs text-gray-500">Min 12 characters, include uppercase, numbers, and symbols</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <input 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm new password"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>Security Tip:</strong> Use a strong, unique password. Never share your password with anyone.
              </p>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </Card>

        <Card className="p-6 mt-6">
          <h3 className="font-bold mb-4">Password Security Standards</h3>
          <ul className="text-sm space-y-2 text-gray-600">
            <li>✓ Minimum 12 characters</li>
            <li>✓ Mix of uppercase and lowercase</li>
            <li>✓ At least one number</li>
            <li>✓ At least one special character (!@#$%etc)</li>
            <li>✓ Not similar to previous passwords</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
