import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { User, Lock, Save, Shield } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', avatar: user?.avatar || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const { data } = await api.put('/auth/profile', {
        name: profileForm.name,
        avatar: profileForm.avatar || undefined,
      });
      updateUser(data.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirm) {
      return toast.error('Passwords do not match');
    }
    setPasswordLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setPasswordLoading(false);
    }
  };

  const roleInfo = {
    superadmin: { label: 'Super Administrator', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30', desc: 'Full system access. Can manage all users, tasks, and system settings.' },
    admin: { label: 'Administrator', color: 'text-azure-400', bg: 'bg-azure-400/10 border-azure-400/30', desc: 'Can manage users and all tasks. Cannot manage superadmin accounts.' },
    user: { label: 'Regular User', color: 'text-gray-300', bg: 'bg-gray-500/10 border-gray-500/30', desc: 'Can create and manage own tasks. Can be assigned tasks by others.' },
  }[user?.role];

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <User size={16} className="text-volt-400" />
          <span className="text-xs text-gray-500 font-mono uppercase tracking-widest">Account</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
      </div>

      {/* User card */}
      <div className="card p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-ink-600 flex items-center justify-center text-2xl font-bold text-volt-400 shrink-0">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <div className="text-xl font-bold text-white">{user?.name}</div>
          <div className="text-gray-400 font-mono text-sm">{user?.email}</div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`role-${user?.role}`}>{user?.role}</span>
            {user?.last_login && (
              <span className="text-xs text-gray-600">
                Last login {format(parseISO(user.last_login), 'MMM d, h:mm a')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Role info */}
      {roleInfo && (
        <div className={`card p-5 border ${roleInfo.bg} flex items-start gap-4`}>
          <Shield size={20} className={`${roleInfo.color} shrink-0 mt-0.5`} />
          <div>
            <div className={`font-semibold ${roleInfo.color}`}>{roleInfo.label}</div>
            <div className="text-sm text-gray-400 mt-1">{roleInfo.desc}</div>
          </div>
        </div>
      )}

      {/* Edit profile */}
      <div className="card p-6">
        <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
          <User size={16} className="text-gray-400" />
          Personal Information
        </h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={profileForm.name}
              onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Your full name" required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input opacity-60 cursor-not-allowed" value={user?.email} disabled />
            <p className="text-xs text-gray-600 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="label">Avatar URL <span className="text-gray-600">(optional)</span></label>
            <input className="input" value={profileForm.avatar}
              onChange={e => setProfileForm(p => ({ ...p, avatar: e.target.value }))}
              placeholder="https://example.com/avatar.jpg" type="url" />
          </div>
          <button type="submit" disabled={profileLoading} className="btn-primary flex items-center gap-2">
            <Save size={16} />
            {profileLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="card p-6">
        <h2 className="font-semibold text-white mb-5 flex items-center gap-2">
          <Lock size={16} className="text-gray-400" />
          Change Password
        </h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" value={passwordForm.currentPassword}
              onChange={e => setPasswordForm(p => ({ ...p, currentPassword: e.target.value }))}
              placeholder="Enter current password" required />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" value={passwordForm.newPassword}
              onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
              placeholder="Min 8 chars, uppercase & number" required minLength={8} />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" className="input" value={passwordForm.confirm}
              onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
              placeholder="Repeat new password" required />
          </div>
          <button type="submit" disabled={passwordLoading} className="btn-primary flex items-center gap-2">
            <Lock size={16} />
            {passwordLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="card p-6">
        <h2 className="font-semibold text-white mb-4">Account Details</h2>
        <div className="space-y-3 font-mono text-sm">
          {[
            ['Account ID', user?.id],
            ['Member since', user?.created_at ? format(parseISO(user.created_at), 'MMMM d, yyyy') : '—'],
            ['Account status', 'Active'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-2 border-b border-ink-700 last:border-0">
              <span className="text-gray-500">{label}</span>
              <span className="text-gray-300 truncate ml-4 max-w-[200px]">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}