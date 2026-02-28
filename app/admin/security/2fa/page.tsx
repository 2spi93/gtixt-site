'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';

export default function Setup2FAPage() {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [step, setStep] = useState<'not-started' | 'setup' | 'verify'>('not-started');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    checkTotpStatus();
  }, []);

  const checkTotpStatus = async () => {
    try {
      const res = await fetch('/api/internal/auth/me/', {
        credentials: 'include',
      });
      const data = await res.json();
      setIs2FAEnabled(data.user?.totp_enabled || false);
    } catch (err: any) {
      console.error('Failed to check TOTP status:', err);
    }
  };

  const handleStartSetup = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch('/api/internal/auth/setup-2fa/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || 'Failed to setup 2FA');

      setQrCode(payload.data.qrCode);
      setSecret(payload.data.secret);
      setStep('setup');
    } catch (err: any) {
      setError(err?.message || 'Failed to start 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!code || code.length !== 6) {
      setError('Code must be 6 digits');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/internal/auth/enable-2fa/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || 'Invalid TOTP code');

      setSuccess('✅ 2FA enabled successfully!');
      setIs2FAEnabled(true);
      setBackupCodes(payload.backup_codes || []);
      setCode('');
      setStep('not-started');
    } catch (err: any) {
      setError(err?.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable 2FA? This will reduce your account security.')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/internal/auth/disable-2fa/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to disable 2FA');

      setSuccess('2FA has been disabled');
      setIs2FAEnabled(false);
      setStep('not-started');
    } catch (err: any) {
      setError(err?.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">🔐 Two-Factor Authentication (2FA)</h1>
      
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded max-w-2xl">
          <p className="text-red-700">⚠️ {error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded max-w-2xl">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="text-xl font-semibold text-gray-700">2FA Status</div>
          <div className={`text-lg font-bold mt-2 ${is2FAEnabled ? 'text-green-600' : 'text-gray-400'}`}>
            {is2FAEnabled ? '✓ Enabled' : '○ Disabled'}
          </div>
          <p className="text-sm text-gray-500 mt-2">Account protection level</p>
        </Card>
        <Card className="p-6">
          <div className="text-xl font-semibold text-gray-700">Method</div>
          <div className="text-lg font-bold text-blue-600 mt-2">TOTP</div>
          <p className="text-sm text-gray-500 mt-2">Authenticator app</p>
        </Card>
        <Card className="p-6">
          <div className="text-xl font-semibold text-gray-700">Backup Codes</div>
          <div className="text-lg font-bold text-purple-600 mt-2">{backupCodes.length}</div>
          <p className="text-sm text-gray-500 mt-2">Available codes</p>
        </Card>
      </div>

      <div className="max-w-2xl space-y-6">
        {!is2FAEnabled && step === 'not-started' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">🔑 Setup Authenticator App (TOTP)</h2>
            <p className="text-gray-600 mb-4">
              Enhance your account security by enabling two-factor authentication.
              You'll need an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator.
            </p>
            
            <button
              onClick={handleStartSetup}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
            >
              {loading ? 'Loading...' : 'Start Setup Process'}
            </button>
          </Card>
        )}

        {step === 'setup' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">📱 Scan QR Code</h2>
            <p className="text-gray-600 mb-4">
              Scan this QR code with your authenticator app:
            </p>
            
            {qrCode && (
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200 text-center mb-4">
                <img src={qrCode} alt="QR Code" className="mx-auto max-w-xs" />
              </div>
            )}

            {secret && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Or enter this secret manually:</p>
                <div className="bg-gray-100 p-3 rounded font-mono text-sm break-all border border-gray-300">
                  {secret}
                </div>
              </div>
            )}

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 6-digit code from your app:
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest font-mono focus:ring-2 focus:ring-blue-500"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('not-started')}
                  disabled={loading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition"
                >
                  {loading ? 'Verifying...' : 'Verify & Enable'}
                </button>
              </div>
            </form>
          </Card>
        )}

        {is2FAEnabled && (
          <Card className="p-6 bg-green-50 border-2 border-green-500">
            <div className="flex items-start gap-4">
              <div className="text-4xl">✅</div>
              <div className="flex-1">
                <h3 className="font-bold text-green-900 text-lg">2FA is Active</h3>
                <p className="text-sm text-green-700 mt-2">
                  Your account is protected with two-factor authentication. 
                  You'll need to enter a code from your authenticator app when logging in.
                </p>
                <button
                  onClick={handleDisable2FA}
                  disabled={loading}
                  className="mt-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-sm font-semibold px-4 py-2 rounded transition"
                >
                  {loading ? 'Processing...' : 'Disable 2FA'}
                </button>
              </div>
            </div>
          </Card>
        )}

        {backupCodes.length > 0 && (
          <Card className="p-6 bg-yellow-50 border-2 border-yellow-200">
            <h3 className="font-bold text-yellow-900 mb-3">🔑 Backup Recovery Codes</h3>
            <p className="text-sm text-yellow-700 mb-4">
              Save these codes in a secure location. Each code can be used once if you lose access to your authenticator app.
            </p>
            <div className="grid grid-cols-2 gap-2 font-mono text-sm text-yellow-900 bg-white p-4 rounded border border-yellow-300">
              {backupCodes.map((code, idx) => (
                <div key={idx} className="py-1">{code}</div>
              ))}
            </div>
            <button
              onClick={() => {
                const text = backupCodes.join('\n');
                navigator.clipboard.writeText(text);
                setSuccess('Backup codes copied to clipboard!');
              }}
              className="mt-4 w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 rounded-lg transition"
            >
              📋 Copy Backup Codes
            </button>
          </Card>
        )}

        <Card className="p-6 bg-blue-50 border-l-4 border-blue-500">
          <h3 className="font-bold text-blue-900 mb-2">Security Recommendations</h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>✓ Use an authenticator app instead of SMS for better security</li>
            <li>✓ Store backup codes in a secure password manager</li>
            <li>✓ Never share your TOTP codes with anyone</li>
            <li>✓ Keep your authenticator app up to date</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
