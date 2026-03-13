import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, clearError } from '../store/authSlice.js';

export default function Login() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => { dispatch(clearError()); }, [dispatch]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(result)) navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Card */}
        <div className="bg-white border border-gray-300 rounded px-10 py-8 mb-3">
          {/* Logo */}
          <h1 className="text-center font-bold text-4xl mb-8"
              style={{ fontFamily: 'Billabong, cursive, serif' }}>
            Instagram
          </h1>

          {error && (
            <p className="bg-red-50 text-red-600 text-sm text-center rounded p-2 mb-4">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full bg-gray-50 border border-gray-300 rounded text-sm px-3 py-2 focus:outline-none focus:border-gray-500"
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full bg-gray-50 border border-gray-300 rounded text-sm px-3 py-2 focus:outline-none focus:border-gray-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded py-1.5 text-sm mt-2 transition"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="flex items-center my-4">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="px-4 text-xs font-semibold text-gray-500">OR</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          <p className="text-center text-xs text-gray-500 mt-4">
            <Link to="/forgot-password" className="text-blue-900 font-semibold">
              Forgot password?
            </Link>
          </p>
        </div>

        {/* Sign up link */}
        <div className="bg-white border border-gray-300 rounded px-10 py-4 text-center text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-500 font-semibold">
            Sign up
          </Link>
        </div>

        {/* App store badges */}
        <p className="text-center text-sm mt-5 text-gray-800">Get the app.</p>
        <div className="flex justify-center gap-3 mt-3">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
            alt="App Store"
            className="h-10"
          />
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
            alt="Google Play"
            className="h-10"
          />
        </div>
      </div>
    </div>
  );
}
