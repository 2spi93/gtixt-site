'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { adminFetch, useAdminAuth } from '@/lib/admin-auth-guard';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  lastLogin?: string;
  totpEnabled?: boolean;
}

export default function UserManagementPage() {
  const auth = useAdminAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
        <h1 className="text-4xl font-bold text-gray-900">👥 <span className="text-[#0A8A9F]">User Management</span></h1>
        <p className="text-gray-600 mt-3 text-lg">Manage admin accounts and permissions</p>
      </div>

      {/* Messages */}
      {error && <div className="bg-white rounded-xl shadow-sm border border-red-300 border-l-4 border-l-red-500 p-4 mb-6 text-red-700 font-semibold">{error}</div>}
      {success && <div className="bg-white rounded-xl shadow-sm border border-green-300 border-l-4 border-l-green-500 p-4 mb-6 text-green-700 font-semibold">{success}</div>}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-sm font-semibold text-[#0A8A9F]">Total Users</div>
          <div className="text-4xl font-bold text-gray-900 mt-2">{users.length}</div>
          <p className="text-sm text-gray-500 mt-1">Active accounts</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-sm font-semibold text-[#0A8A9F]">Admins</div>
          <div className="text-4xl font-bold text-gray-900 mt-2">{users.filter(u => u.role === 'admin').length}</div>
          <p className="text-sm text-gray-500 mt-1">Full access</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-sm font-semibold text-[#0A8A9F]">2FA Enabled</div>
          <div className="text-4xl font-bold text-gray-900 mt-2">{users.filter(u => u.totpEnabled).length}</div>
          <p className="text-sm text-gray-500 mt-1">Secure</p>
        </div>
      </div>

      {/* Add User Button */}
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="px-6 py-3 bg-[#0A8A9F] hover:bg-[#087080] text-white font-semibold rounded-lg shadow-sm mb-6"
      >
        {showAddForm ? '✕ Cancel' : '➕ Add New User'}
      </button>

      {/* Add User Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-[#0A8A9F] mb-4">Create New User</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#0A8A9F] focus:border-transparent"
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#0A8A9F] focus:border-transparent"
            />
            <input
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#0A8A9F] focus:border-transparent"
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-[#0A8A9F] focus:border-transparent"
            >
              <option value="admin" className="bg-white text-gray-900">👑 Super Admin</option>
              <option value="manager" className="bg-white text-gray-900">📋 Manager</option>
              <option value="analyst" className="bg-white text-gray-900">📊 Analyst</option>
              <option value="viewer" className="bg-white text-gray-900">👁️ Viewer</option>
            </select>
            <div className="flex gap-3">
              <button
                onClick={addUser}
                className="px-6 py-2 bg-[#0A8A9F] hover:bg-[#087080] text-white font-semibold rounded-lg"
              >
                ✅ Create
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#0A8A9F] focus:border-transparent"
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-[#0A8A9F] focus:border-transparent"
          >
            <option value="all" className="bg-white">All Roles</option>
            <option value="admin" className="bg-white">👑 Admin</option>
            <option value="manager" className="bg-white">📋 Manager</option>
            <option value="analyst" className="bg-white">📊 Analyst</option>
            <option value="viewer" className="bg-white">👁️ Viewer</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <p className="text-gray-600 font-medium">
            Showing <span className="text-[#0A8A9F] font-bold">{filteredUsers.length}</span> of <span className="text-[#0A8A9F] font-bold">{users.length}</span> users
          </p>
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(''); setFilterRole('all'); }}
              className="text-xs px-3 py-1 bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 rounded"
            >
              Clear Filters
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-bold text-[#0A8A9F]">Username</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#0A8A9F]">Email</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#0A8A9F]">Role</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#0A8A9F]">2FA</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-[#0A8A9F]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-gray-900 font-mono">
                      {editingUser?.id === user.id ? (
                        <input 
                          type="text" 
                          value={editingUser.username || ''} 
                          onChange={(e) => setEditingUser({...editingUser, username: e.target.value})} 
                          className="bg-white border border-gray-300 rounded px-2 py-1 text-gray-900 w-full focus:ring-2 focus:ring-[#0A8A9F] focus:border-transparent"
                        />
                      ) : (
                        user.username
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {editingUser?.id === user.id ? (
                        <input 
                          type="email" 
                          value={editingUser.email || ''} 
                          onChange={(e) => setEditingUser({...editingUser, email: e.target.value})} 
                          className="bg-white border border-gray-300 rounded px-2 py-1 text-gray-900 w-full focus:ring-2 focus:ring-[#0A8A9F] focus:border-transparent"
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
                          className="bg-white border border-gray-300 rounded px-2 py-1 text-gray-900 focus:ring-2 focus:ring-[#0A8A9F] focus:border-transparent"
                        >
                          <option value="admin">👑 Admin</option>
                          <option value="manager">📋 Manager</option>
                          <option value="analyst">📊 Analyst</option>
                          <option value="viewer">👁️ Viewer</option>
                        </select>
                      ) : (
                        <span className="px-3 py-1 bg-[#0A8A9F]/10 text-[#0A8A9F] border border-[#0A8A9F]/30 rounded-lg text-xs font-semibold">
                          {user.role === 'admin' ? '👑' : user.role === 'manager' ? '📋' : user.role === 'analyst' ? '📊' : '👁️'} {user.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">{user.totpEnabled ? <span className="text-green-500 font-bold">✅</span> : <span className="text-gray-400">⭕</span>}</td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      {editingUser?.id === user.id ? (
                        <>
                          <button onClick={saveUser} className="text-green-600 hover:text-green-700 font-semibold">✓ Save</button>
                          <button onClick={() => setEditingUser(null)} className="text-gray-600 hover:text-gray-700 font-semibold">✕ Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setEditingUser(user)} className="text-[#0A8A9F] hover:text-[#087080] font-semibold">✏️ Edit</button>
                          <button onClick={() => deleteUser(user.id)} className="text-red-600 hover:text-red-700 font-semibold">🗑️ Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No users found matching your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
