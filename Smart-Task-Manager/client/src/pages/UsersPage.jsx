import { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Users, Search, Plus, Edit2, Trash2, X, Shield, UserCheck, UserX } from 'lucide-react';

const ROLES = ['user', 'admin', 'superadmin'];

function UserModal({ user: editUser, onClose, onSave, isSuperAdmin }) {
  const isEdit = !!editUser?.id;
  const [form, setForm] = useState({
    name: editUser?.name || '',
    email: editUser?.email || '',
    password: '',
    role: editUser?.role || 'user',
    is_active: editUser?.is_active !== undefined ? editUser.is_active : true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (isEdit) {
        const payload = { name: form.name, role: form.role, is_active: form.is_active };
        res = await api.put(`/users/${editUser.id}`, payload);
      } else {
        res = await api.post('/users', form);
      }
      toast.success(isEdit ? 'User updated!' : 'User created!');
      onSave(res.data.data.user);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const availableRoles = isSuperAdmin ? ROLES : ROLES.filter(r => r !== 'superadmin');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-ink-800 border border-ink-600 rounded-2xl shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-700">
          <h2 className="font-bold text-white text-lg">{isEdit ? 'Edit User' : 'Create User'}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input className="input" placeholder="Jane Smith" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>

          {!isEdit && (
            <>
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input" placeholder="jane@example.com" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Password *</label>
                <input type="password" className="input" placeholder="Min 8 characters" value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={8} />
              </div>
            </>
          )}

          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
              {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {isEdit && (
            <div className="flex items-center justify-between p-4 bg-ink-700 rounded-xl">
              <div>
                <div className="text-sm font-medium text-white">Account Status</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {form.is_active ? 'Active — user can log in' : 'Inactive — login blocked'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${form.is_active ? 'bg-volt-400' : 'bg-ink-500'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.is_active ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({ search: '', role: '', page: 1 });
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await api.get('/users', { params });
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this user and all their data?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted');
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleToggleActive = async (u) => {
    try {
      const { data } = await api.put(`/users/${u.id}`, { is_active: !u.is_active });
      setUsers(prev => prev.map(usr => usr.id === u.id ? { ...usr, ...data.data.user } : usr));
      toast.success(u.is_active ? 'User deactivated' : 'User activated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleSave = (saved) => {
    setUsers(prev => {
      const exists = prev.find(u => u.id === saved.id);
      return exists ? prev.map(u => u.id === saved.id ? { ...u, ...saved } : u) : [saved, ...prev];
    });
    setShowModal(false);
    setEditUser(null);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={16} className="text-azure-400" />
            <span className="text-xs text-gray-500 font-mono uppercase tracking-widest">Admin Panel</span>
          </div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 mt-1">
            {pagination.total || 0} users total
          </p>
        </div>
        <button onClick={() => { setEditUser(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input pl-9 py-2 text-sm" placeholder="Search users..."
            value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value, page: 1 }))} />
        </div>
        <select className="input py-2 text-sm w-auto" value={filters.role}
          onChange={e => setFilters(p => ({ ...p, role: e.target.value, page: 1 }))}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Users table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-700">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Tasks</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-700">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-6 py-4"><div className="shimmer h-8 rounded" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No users found</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-ink-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-ink-600 flex items-center justify-center text-sm font-bold text-volt-400 shrink-0">
                          {u.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-white text-sm flex items-center gap-2">
                            {u.name}
                            {u.id === currentUser?.id && (
                              <span className="text-xs text-gray-500">(you)</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`role-${u.role}`}>{u.role}</span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="text-sm text-gray-400 font-mono">{u.task_count || 0}</span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className={`badge ${u.is_active ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-500 border-gray-500/30'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {u.id !== currentUser?.id && (
                          <>
                            <button
                              onClick={() => handleToggleActive(u)}
                              className={`btn-ghost p-2 ${u.is_active ? 'hover:text-orange-400' : 'hover:text-green-400'}`}
                              title={u.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {u.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
                            </button>
                            <button
                              onClick={() => { setEditUser(u); setShowModal(true); }}
                              className="btn-ghost p-2 hover:text-white"
                              title="Edit"
                            >
                              <Edit2 size={15} />
                            </button>
                            {isSuperAdmin && (
                              <button
                                onClick={() => handleDelete(u.id)}
                                className="btn-ghost p-2 hover:text-coral-400"
                                title="Delete permanently"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-ink-700 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing {((filters.page - 1) * 20) + 1}–{Math.min(filters.page * 20, pagination.total)} of {pagination.total}
            </span>
            <div className="flex gap-2">
              <button disabled={filters.page <= 1} onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
                className="btn-secondary text-sm disabled:opacity-40">Prev</button>
              <button disabled={filters.page >= pagination.pages} onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
                className="btn-secondary text-sm disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <UserModal
          user={editUser}
          isSuperAdmin={isSuperAdmin}
          onClose={() => { setShowModal(false); setEditUser(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}