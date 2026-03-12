import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, CheckSquare, Users, User, LogOut,
  Menu, X, Zap, ChevronRight, Bell
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
];

const adminItems = [
  { to: '/users', icon: Users, label: 'Users' },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColor = {
    superadmin: 'text-purple-400',
    admin: 'text-azure-400',
    user: 'text-gray-400',
  }[user?.role] || 'text-gray-400';

  const roleBadge = {
    superadmin: 'role-superadmin',
    admin: 'role-admin',
    user: 'role-user',
  }[user?.role] || 'role-user';

  const Sidebar = ({ mobile = false }) => (
    <aside className={`
      ${mobile ? 'fixed inset-0 z-50 flex' : 'hidden lg:flex'}
      flex-col
    `}>
      {mobile && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`
        relative flex flex-col h-full w-64 bg-ink-900 border-r border-ink-700
        ${mobile ? 'shadow-2xl' : ''}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-ink-700">
          <div className="w-8 h-8 bg-volt-400 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-ink-950" fill="currentColor" />
          </div>
          <div>
            <div className="font-bold text-white text-lg leading-none">TaskFlow</div>
            <div className="text-xs text-gray-500 font-mono">Smart Manager</div>
          </div>
          {mobile && (
            <button onClick={() => setSidebarOpen(false)} className="ml-auto btn-ghost p-1.5">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 mb-3">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Main</span>
          </div>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => mobile && setSidebarOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="px-3 mt-4 mb-3">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Admin</span>
              </div>
              {adminItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => mobile && setSidebarOpen(false)}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* User section */}
        <div className="px-3 py-3 border-t border-ink-700 space-y-1">
          <NavLink
            to="/profile"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => mobile && setSidebarOpen(false)}
          >
            <div className="w-7 h-7 rounded-lg bg-ink-600 flex items-center justify-center text-xs font-bold text-volt-400">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.name}</div>
              <span className={`text-xs ${roleColor} font-mono`}>{user?.role}</span>
            </div>
            <ChevronRight size={14} className="text-gray-600" />
          </NavLink>
          <button onClick={handleLogout} className="nav-link w-full text-left hover:text-coral-400">
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-ink-950 overflow-hidden">
      <Sidebar />
      {sidebarOpen && <Sidebar mobile />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-4 px-4 py-3 bg-ink-900 border-b border-ink-700">
          <button onClick={() => setSidebarOpen(true)} className="btn-ghost p-2">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-volt-400 rounded-md flex items-center justify-center">
              <Zap size={12} className="text-ink-950" fill="currentColor" />
            </div>
            <span className="font-bold text-white">TaskFlow</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className={`badge ${roleBadge}`}>{user?.role}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}