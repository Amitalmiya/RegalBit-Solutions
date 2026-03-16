import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice.js';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Navbar() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useSelector((s) => s.auth);
  const { chat }  = useSelector((s) => s);
  const { theme, toggleTheme } = useTheme();
  const [menu, setMenu] = useState(false);

  const handleLogout = () => { dispatch(logout()); navigate('/login'); };
  const isActive = (path) => location.pathname.startsWith(path) && path !== '/'
    ? true
    : location.pathname === path;

  const NavBtn = ({ to, title, children, badge }) => (
    <Link to={to} title={title}
      className="relative flex items-center justify-center w-10 h-10 rounded-xl transition-all"
      style={{
        background: isActive(to) ? 'rgba(147,51,234,0.15)' : 'transparent',
        color: isActive(to) ? 'var(--accent-1)' : 'var(--text-secondary)',
      }}>
      {children}
      {badge > 0 && (
        <span className="absolute top-1 right-1 w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center"
          style={{ background: 'var(--accent-2)', color: '#fff', fontSize: '9px' }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass"
      style={{ borderBottom: '1px solid var(--border)', height: '60px' }}>
      <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="gradient-text font-bold"
          style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.7rem', lineHeight: 1 }}>
          Instagram
        </Link>

        {/* Icons */}
        <div className="flex items-center gap-1">

          {/* Home */}
          <NavBtn to="/" title="Home">
            <svg className="w-5 h-5" fill={isActive('/') ? 'currentColor' : 'none'}
              stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline strokeLinecap="round" strokeLinejoin="round" points="9 22 9 12 15 12 15 22" />
            </svg>
          </NavBtn>

          {/* Explore */}
          <NavBtn to="/explore" title="Explore">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </NavBtn>

          {/* Create */}
          <NavBtn to="/create" title="Create Post">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </NavBtn>

          {/* ── MESSAGES ── */}
          <NavBtn to="/messages" title="Messages" badge={chat?.unreadCount}>
            <svg className="w-5 h-5" fill={isActive('/messages') ? 'currentColor' : 'none'}
              stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          </NavBtn>

          {/* Theme toggle */}
          <button onClick={toggleTheme}
            className="theme-toggle mx-1 no-transition"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme">
            <span className="theme-toggle-thumb no-transition">
              {theme === 'dark' ? '🌙' : '☀️'}
            </span>
          </button>

          {/* Profile dropdown */}
          <div className="relative ml-1">
            <button onClick={() => setMenu(!menu)}
              className="flex items-center justify-center w-10 h-10 rounded-xl transition-all"
              style={{ background: menu ? 'rgba(147,51,234,0.15)' : 'transparent' }}>
              <img src={user?.avatar} alt={user?.username}
                className="w-7 h-7 rounded-full object-cover"
                style={{
                  outline: isActive(`/profile/${user?.username}`) ? '2px solid var(--accent-1)' : 'none',
                  outlineOffset: '2px',
                }} />
            </button>

            {menu && (
              <div className="absolute right-0 mt-2 w-56 glass rounded-2xl overflow-hidden animate-scale-in"
                style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                <Link to={`/profile/${user?.username}`} onClick={() => setMenu(false)}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover-overlay)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <img src={user?.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.username}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>View profile</p>
                  </div>
                </Link>

                <Link to="/messages" onClick={() => setMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm"
                  style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover-overlay)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                  Messages
                </Link>

                <Link to="/edit-profile" onClick={() => setMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm"
                  style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover-overlay)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  Edit Profile
                </Link>

                <button onClick={() => { toggleTheme(); setMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm"
                  style={{ color: 'var(--text-secondary)', background: 'transparent',
                    border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover-overlay)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <span className="text-base">{theme === 'dark' ? '☀️' : '🌙'}</span>
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>

                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm"
                  style={{ color: '#f87171', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(248,113,113,0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}