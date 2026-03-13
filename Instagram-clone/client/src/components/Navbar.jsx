import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice.js';

export default function Navbar() {
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const location    = useLocation();
  const { user }    = useSelector((s) => s.auth);
  const [menu, setMenu] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-300">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="text-2xl font-bold"
          style={{ fontFamily: 'Billabong, cursive, serif' }}>
          Instagram
        </Link>

        {/* Nav icons */}
        <div className="flex items-center gap-5">
          {/* Home */}
          <Link to="/" title="Home">
            <svg xmlns="http://www.w3.org/2000/svg"
              className={`w-6 h-6 ${isActive('/') ? 'fill-black' : 'fill-none stroke-black stroke-2'}`}
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline strokeLinecap="round" strokeLinejoin="round"
                points="9 22 9 12 15 12 15 22" />
            </svg>
          </Link>

          {/* Explore */}
          <Link to="/explore" title="Explore">
            <svg xmlns="http://www.w3.org/2000/svg"
              className={`w-6 h-6 ${isActive('/explore') ? 'fill-black' : 'fill-none stroke-black stroke-2'}`}
              viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>

          {/* Create */}
          <Link to="/create" title="Create">
            <svg xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 fill-none stroke-black stroke-2"
              viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </Link>

          {/* Profile / Menu */}
          <div className="relative">
            <button onClick={() => setMenu(!menu)}>
              <img
                src={user?.avatar}
                alt={user?.username}
                className={`w-6 h-6 rounded-full object-cover ${
                  isActive(`/profile/${user?.username}`) ? 'ring-2 ring-black' : ''
                }`}
              />
            </button>

            {menu && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                <Link
                  to={`/profile/${user?.username}`}
                  onClick={() => setMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50"
                >
                  <img src={user?.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold">{user?.username}</p>
                    <p className="text-gray-500 text-xs">View profile</p>
                  </div>
                </Link>
                <hr className="border-gray-100" />
                <Link
                  to="/edit-profile"
                  onClick={() => setMenu(false)}
                  className="block px-4 py-3 text-sm hover:bg-gray-50"
                >
                  Edit Profile
                </Link>
                <hr className="border-gray-100" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-gray-50"
                >
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
