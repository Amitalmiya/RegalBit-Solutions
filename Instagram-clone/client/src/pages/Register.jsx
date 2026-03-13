import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, clearError } from '../store/authSlice.js';

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    email: '', fullName: '', username: '', password: '',
  });

  useEffect(() => { dispatch(clearError()); }, [dispatch]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(registerUser(form));
    if (registerUser.fulfilled.match(result)) navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="bg-white border border-gray-300 rounded px-10 py-8 mb-3">
          <h1 className="text-center font-bold text-4xl mb-4"
              style={{ fontFamily: 'Billabong, cursive, serif' }}>
            Instagram
          </h1>
          <p className="text-center text-gray-500 font-semibold text-base mb-6">
            Sign up to see photos and videos from your friends.
          </p>

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
              name="fullName"
              type="text"
              placeholder="Full Name"
              value={form.fullName}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-300 rounded text-sm px-3 py-2 focus:outline-none focus:border-gray-500"
            />
            <input
              name="username"
              type="text"
              placeholder="Username"
              value={form.username}
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
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-4">
            By signing up, you agree to our{' '}
            <span className="font-semibold">Terms</span>,{' '}
            <span className="font-semibold">Privacy Policy</span> and{' '}
            <span className="font-semibold">Cookies Policy</span>.
          </p>
        </div>

        <div className="bg-white border border-gray-300 rounded px-10 py-4 text-center text-sm">
          Have an account?{' '}
          <Link to="/login" className="text-blue-500 font-semibold">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
