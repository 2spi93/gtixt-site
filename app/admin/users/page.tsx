'use client';

import { useState, useEffect } from 'react';
import { adminFetch, useAdminAuth } from '@/lib/admin-auth-guard';
import { useRouter } from 'next/navigation';
import { RealIcon } from '@/components/design-system/RealIcon';
import { GlassCard, GradientText } from '@/components/design-system/GlassComponents';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  lastLogin?: string;
  totpEnabled?: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  analyst: 'Analyst',
  viewer: 'Viewer',
};

const ROLE_ICONS: Record<string, 'shield' | 'operations' | 'analytics' | 'review'> = {
  admin: 'shield',
  manager: 'operations',
  analyst: 'analytics',
  viewer: 'review',
};

export default function UserManagementPage() {
  const auth = useAdminAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'reviewer' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    if (!auth.loading && auth.user && auth.user.role !== 'admin') {
      router.push('/admin');
    }
  }, [auth.loading, auth.user, router]);

  useEffect(() => {
    if (!auth.loading && auth.authenticated) {
      fetchUsers();
    }
  }, [auth.loading, auth.authenticated]);

  const fetchUsers = async () => {
    try {
      const res = await adminFetch('/api/admin/users');
      const data = await res.json();
      setUsers(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const saveUser = async () => {
    if (!editingUser) return;
    try {
      const res = await adminFetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('User updated');
        setEditingUser(null);
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to save user');
      }
    } catch (_err) {
      setError('Error saving user');
    }
  };

  const addUser = async () => {
    if (!newUser.username || !newUser.password) {
      setError('Username and password required');
      return;
    }
    try {
      const res = await adminFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('User created');
        setNewUser({ username: '', email: '', password: '', role: 'admin' });
        setShowAddForm(false);
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (_err) {
      setError('Error creating user');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await adminFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Failed to delete user');
        return;
      }
      if (data.success) {
        setSuccess('User deleted');
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to delete user');
      }
    } catch (_err) {
      setError('Error deleting user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <GlassCard variant="dark" className="mb-6" hover={false}>
        <div className="flex items-center gap-3 mb-3">
          <RealIcon name="users" size={26} className="opacity-95" />
          <h1 className="text-4xl font-bold text-slate-100"><GradientText variant="h1">User Management</GradientText></h1>
        </div>
        <p className="text-slate-300 mt-1 text-lg">Manage admin accounts and permissions</p>
      </GlassCard>

      {/* Messages */}
      {error && <div className="bg-red-900/20 rounded-xl border border-red-500/50 p-4 mb-6 text-red-300 font-semibold">{error}</div>}
      {success && <div className="bg-green-900/20 rounded-xl border border-green-500/50 p-4 mb-6 text-green-300 font-semibold">{success}</div>}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <GlassCard variant="light" hover={false}>
          <div className="text-sm font-semibold text-cyan-300">Total Users</div>
          <div className="text-4xl font-bold text-white mt-2">{users.length}</div>
          <p className="text-sm text-slate-400 mt-1">Active accounts</p>
        </GlassCard>
        <GlassCard variant="light" hover={false}>
          <div className="text-sm font-semibold text-cyan-300">Admins</div>
          <div className="text-4xl font-bold text-white mt-2">{users.filter(u => u.role === 'admin').length}</div>
          <p className="text-sm text-slate-400 mt-1">Full access</p>
        </GlassCard>
        <GlassCard variant="light" hover={false}>
          <div className="text-sm font-semibold text-cyan-300">2FA Enabled</div>
          <div className="text-4xl font-bold text-white mt-2">{users.filter(u => u.totpEnabled).length}</div>
          <p className="text-sm text-slate-400 mt-1">Secure</p>
        </GlassCard>
      </div>

      {/* Add User Button */}
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-lg shadow-lg shadow-cyan-500/30 mb-6 transition-all"
      >
        {showAddForm ? 'Cancel' : 'Add New User'}
      </button>

      {/* Add User Form */}
      {showAddForm && (
        <div className="bg-slate-900/40 backdrop-blur-md rounded-xl border border-cyan-500/30 p-6 mb-6">
          <h2 className="text-xl font-bold text-cyan-300 mb-4">Create New User</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
            <input
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="admin" className="bg-slate-900 text-white">Super Admin</option>
              <option value="manager" className="bg-slate-900 text-white">Manager</option>
              <option value="analyst" className="bg-slate-900 text-white">Analyst</option>
              <option value="viewer" className="bg-slate-900 text-white">Viewer</option>
            </select>
            <div className="flex gap-3">
              <button
                onClick={addUser}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-lg"
              >
                Create
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 bg-slate-700/70 hover:bg-slate-600 text-slate-100 font-semibold rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="bg-slate-900/40 backdrop-blur-md rounded-xl border border-cyan-500/30 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 bg-slate-800/50 border border-cyan-500/30 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 bg-slate-800/50 border border-cyan-500/30 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="all" className="bg-slate-900">All Roles</option>
            <option value="admin" className="bg-slate-900">Admin</option>
            <option value="manager" className="bg-slate-900">Manager</option>
            <option value="analyst" className="bg-slate-900">Analyst</option>
            <option value="viewer" className="bg-slate-900">Viewer</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/40 backdrop-blur-md rounded-xl border border-cyan-500/30 overflow-hidden">
        <div className="px-6 py-4 border-b border-cyan-500/20 flex justify-between items-center">
          <p className="text-slate-300 font-medium">
            Showing <span className="text-cyan-300 font-bold">{filteredUsers.length}</span> of <span className="text-cyan-300 font-bold">{users.length}</span> users
          </p>
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(''); setFilterRole('all'); }}
              className="text-xs px-3 py-1 bg-red-900/20 hover:bg-red-900/30 border border-red-500/40 text-red-300 rounded"
            >
              Clear Filters
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cyan-500/20 bg-slate-800/30">
                <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300">Username</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300">Email</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300">Role</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300">2FA</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-cyan-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-cyan-500/10 hover:bg-slate-800/25 transition">
                    <td className="px-6 py-4 text-slate-100 font-mono">
                      {editingUser?.id === user.id ? (
                        <input 
                          type="text" 
                          value={editingUser.username || ''} 
                          onChange={(e) => setEditingUser({...editingUser, username: e.target.value})} 
                          className="bg-slate-800/50 border border-cyan-500/30 rounded px-2 py-1 text-white w-full focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        />
                      ) : (
                        user.username
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {editingUser?.id === user.id ? (
                        <input 
                          type="email" 
                          value={editingUser.email || ''} 
                          onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} 
                          className="bg-slate-800/50 border border-cyan-500/30 rounded px-2 py-1 text-white w-full focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          placeholder="Entrez l'email..."
                        />
                      ) : (
                        user.email || 'N/A'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingUser?.id === user.id ? (
                        <select
                          value={editingUser.role}
                          onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                          className="bg-slate-800/50 border border-cyan-500/30 rounded px-2 py-1 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="analyst">Analyst</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 text-cyan-200 border border-cyan-500/30 rounded-lg text-xs font-semibold">
                          <RealIcon name={ROLE_ICONS[user.role] || 'users'} size={12} />
                          {ROLE_LABELS[user.role] || user.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">{user.totpEnabled ? <span className="text-green-400 font-bold">Enabled</span> : <span className="text-slate-400">Disabled</span>}</td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      {editingUser?.id === user.id ? (
                        <>
                          <button onClick={saveUser} className="text-green-400 hover:text-green-300 font-semibold">Save</button>
                          <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-300 font-semibold">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setEditingUser(user)} className="text-cyan-300 hover:text-cyan-200 font-semibold">Edit</button>
                          <button onClick={() => deleteUser(user.id)} className="text-red-400 hover:text-red-300 font-semibold">Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No users found matching your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </div>
  );
}
