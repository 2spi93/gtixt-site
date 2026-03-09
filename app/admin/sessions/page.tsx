'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminFetch, useAdminAuth } from '@/lib/admin-auth-guard';
import { useRouter } from 'next/navigation';
import { RealIcon } from '@/components/design-system/RealIcon';

interface SessionRow {
  id: number;
  user_id: number;
  username: string;
  email: string | null;
  role: string;
  expires_at: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export default function AdminSessionsPage() {
  const auth = useAdminAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expiredCount, setExpiredCount] = useState(0);
  const [cleaningUp, setCleaningUp] = useState(false);

  useEffect(() => {
    if (!auth.loading && auth.user && auth.user.role !== 'admin') {
      router.push('/admin');
    }
  }, [auth.loading, auth.user, router]);

  useEffect(() => {
    if (!auth.loading && auth.authenticated) {
      fetchSessions();
      fetchExpiredCount();
    }
  }, [auth.loading, auth.authenticated]);

  const fetchSessions = async () => {
    try {
      const res = await adminFetch('/api/admin/sessions?limit=200');
      const data = await res.json();
      setSessions(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setError('Impossible de charger les sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpiredCount = async () => {
    try {
      const res = await adminFetch('/api/admin/sessions/cleanup');
      const data = await res.json();
      setExpiredCount(data.expiredCount || 0);
    } catch (err) {
      console.error('Failed to get expired count:', err);
    }
  };

  const cleanupExpiredSessions = async () => {
    if (!confirm(`Supprimer ${expiredCount} session(s) expirée(s) ?`)) return;
    setCleaningUp(true);
    try {
      const res = await adminFetch('/api/admin/sessions/cleanup', { method: 'POST' });
      const data = await res.json();
      setSuccess(`${data.deletedCount} session(s) supprimée(s)`);
      await fetchSessions();
      await fetchExpiredCount();
    } catch (err) {
      console.error('Failed to cleanup sessions:', err);
      setError('Erreur lors du nettoyage');
    } finally {
      setCleaningUp(false);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const revokeSession = async (id: number) => {
    if (!confirm('Revoquer cette session ?')) return;
    try {
      await adminFetch(`/api/admin/sessions/${id}`, { method: 'DELETE' });
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Failed to revoke session:', err);
      setError('Erreur lors de la révocation');
    }
  };

  if (auth.loading || loading) {
    return <div className="text-white/70 p-8">Chargement...</div>;
  }

  if (!auth.authenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 text-white">
      <Card className="bg-slate-900/50 backdrop-blur-xl border-cyan-400/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="inline-flex items-center gap-3">
                <RealIcon name="users" size={20} />
                Sessions actives
              </CardTitle>
              <p className="text-sm text-slate-400 mt-1">
                {sessions.length} session(s) • {expiredCount} expirée(s)
              </p>
            </div>
            {expiredCount > 0 && (
              <button
                onClick={cleanupExpiredSessions}
                disabled={cleaningUp}
                className="px-4 py-2 bg-yellow-600/70 hover:bg-yellow-500 rounded text-white text-sm font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-2"
              >
                <RealIcon name="operations" size={14} />
                {cleaningUp ? 'Nettoyage...' : `Nettoyer ${expiredCount} expirée(s)`}
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {success && <div className="mb-4 text-green-300 bg-green-900/20 border border-green-500/40 rounded-lg px-3 py-2">{success}</div>}
          {error && <div className="mb-4 text-red-400">{error}</div>}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-cyan-300">
                  <th className="text-left p-2">Utilisateur</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-left p-2">IP</th>
                  <th className="text-left p-2">Expire</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const isExpired = new Date(s.expires_at) < new Date();
                  return (
                    <tr key={s.id} className={`border-t border-white/10 ${isExpired ? 'bg-red-900/20' : ''}`}>
                      <td className="p-2">
                        {s.username} {s.email ? `(${s.email})` : ''}
                        {isExpired && <span className="ml-2 text-xs text-red-400">EXPIRÉE</span>}
                      </td>
                      <td className="p-2">{s.role}</td>
                      <td className="p-2">{s.ip_address || '-'}</td>
                      <td className="p-2">
                        <span className={isExpired ? 'text-red-400' : ''}>
                          {new Date(s.expires_at).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-2">
                        <button
                          className="px-3 py-1 rounded bg-red-600/70 hover:bg-red-600"
                          onClick={() => revokeSession(s.id)}
                        >
                          Revoquer
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {sessions.length === 0 && (
                  <tr>
                    <td className="p-4 text-white/60" colSpan={5}>
                      Aucune session active.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
