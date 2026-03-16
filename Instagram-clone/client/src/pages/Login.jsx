import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, clearError } from '../store/authSlice.js';

function validateLoginForm({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email';
  if (!password) errors.password = 'Password is required';
  return errors;
}

function Field({ name, type = 'text', value, onChange, onBlur, error, touched, placeholder, children }) {
  const hasError = touched && error;
  return (
    <div className="mb-4">
      <div className="relative">
        <input
          id={name} name={name} type={type}
          placeholder={placeholder} value={value}
          onChange={onChange} onBlur={onBlur} autoComplete={name}
          className={`input-base w-full px-4 py-3 text-sm ${hasError ? 'input-error' : ''}`}
          style={{ borderRadius: '10px' }}
        />
        {children}
      </div>
      {hasError && (
        <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1.5 pl-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error: serverError } = useSelector((s) => s.auth);
  const [form,        setForm]        = useState({ email: '', password: '' });
  const [errors,      setErrors]      = useState({});
  const [touched,     setTouched]     = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPass,    setShowPass]    = useState(false);

  useEffect(() => { dispatch(clearError()); }, [dispatch]);
  useEffect(() => {
    if (serverError && typeof serverError === 'object') setFieldErrors(serverError);
    else setFieldErrors({});
  }, [serverError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (touched[name]) {
      const errs = validateLoginForm({ ...form, [name]: value });
      setErrors((p) => ({ ...p, [name]: errs[name] }));
    }
    if (fieldErrors[name]) setFieldErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));
    const errs = validateLoginForm(form);
    setErrors((p) => ({ ...p, [name]: errs[name] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const errs = validateLoginForm(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const result = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(result)) navigate('/');
  };

  const generalError = serverError && typeof serverError === 'string' ? serverError : null;
  const getError = (f) => fieldErrors[f] || errors[f];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: 'var(--accent-1)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: 'var(--accent-2)' }} />
      <div className="w-full max-w-sm relative z-10">
        <div className="glass rounded-2xl px-8 py-10 mb-3 animate-fade-up" style={{ borderRadius: '20px' }}>
          <div className="text-center mb-8">
            <h1 className="gradient-text font-bold mb-1"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.8rem' }}>
              Instagram
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sign in to your account</p>
          </div>
          {generalError && (
            <div className="mb-4 p-3 rounded-xl text-sm text-center"
              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#fca5a5' }}>
              {generalError}
            </div>
          )}
          <form onSubmit={handleSubmit} noValidate>
            <Field name="email" type="email" placeholder="Email address"
              value={form.email} onChange={handleChange} onBlur={handleBlur}
              error={getError('email')} touched={touched.email} />
            <Field name="password" type={showPass ? 'text' : 'password'}
              placeholder="Password" value={form.password}
              onChange={handleChange} onBlur={handleBlur}
              error={getError('password')} touched={touched.password}>
              <button type="button" onClick={() => setShowPass((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold"
                style={{ color: 'var(--accent-1)' }}>
                {showPass ? 'Hide' : 'Show'}
              </button>
            </Field>
            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 rounded-xl text-sm font-semibold mt-1 disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
          <div className="flex items-center my-5">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="px-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>OR</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>
          <p className="text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
            <Link to="/forgot-password" className="font-semibold hover:underline" style={{ color: 'var(--accent-1)' }}>
              Forgot password?
            </Link>
          </p>
        </div>
        <div className="glass rounded-2xl px-8 py-4 text-center text-sm animate-fade-up stagger-1" style={{ borderRadius: '16px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Don't have an account? </span>
          <Link to="/register" className="font-semibold" style={{ color: 'var(--accent-1)' }}>Sign up</Link>
        </div>
      </div>
    </div>
  );
}