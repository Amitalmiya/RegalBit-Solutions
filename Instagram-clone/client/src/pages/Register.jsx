import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, clearError } from '../store/authSlice.js';

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 6)           score++;
  if (password.length >= 10)          score++;
  if (/[A-Z]/.test(password))         score++;
  if (/[0-9]/.test(password))         score++;
  if (/[^A-Za-z0-9]/.test(password))  score++;
  const map = [
    { label: 'Very Weak',  color: '#f87171' },
    { label: 'Weak',       color: '#fb923c' },
    { label: 'Fair',       color: '#fbbf24' },
    { label: 'Strong',     color: '#60a5fa' },
    { label: 'Very Strong',color: '#34d399' },
  ];
  return { score, ...map[Math.min(score, 4)] };
}

function validateRegisterForm({ email, fullName, username, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address';
  if (fullName && fullName.trim().length > 60) errors.fullName = 'Full name cannot exceed 60 characters';
  if (!username.trim()) errors.username = 'Username is required';
  else if (username.trim().length < 3) errors.username = 'Username must be at least 3 characters';
  else if (username.trim().length > 30) errors.username = 'Username cannot exceed 30 characters';
  else if (!/^[a-zA-Z0-9._]+$/.test(username)) errors.username = 'Only letters, numbers, dots and underscores';
  if (!password) errors.password = 'Password is required';
  else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
  else if (!/[A-Z]/.test(password)) errors.password = 'Must contain at least one uppercase letter';
  else if (!/[0-9]/.test(password)) errors.password = 'Must contain at least one number';
  return errors;
}

function Field({ label, name, type = 'text', value, onChange, onBlur, error, touched, placeholder, children }) {
  const hasError = touched && error;
  return (
    <div className="mb-3">
      <div className="relative">
        <input
          id={name} name={name} type={type} placeholder={placeholder || label}
          value={value} onChange={onChange} onBlur={onBlur} autoComplete={name}
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

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error: serverError } = useSelector((s) => s.auth);
  const [form,        setForm]        = useState({ email: '', fullName: '', username: '', password: '' });
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
      const errs = validateRegisterForm({ ...form, [name]: value });
      setErrors((p) => ({ ...p, [name]: errs[name] }));
    }
    if (fieldErrors[name]) setFieldErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));
    const errs = validateRegisterForm(form);
    setErrors((p) => ({ ...p, [name]: errs[name] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, fullName: true, username: true, password: true });
    const errs = validateRegisterForm(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const result = await dispatch(registerUser(form));
    if (registerUser.fulfilled.match(result)) navigate('/');
  };

  const generalError = serverError && typeof serverError === 'string' ? serverError : null;
  const getError = (f) => fieldErrors[f] || errors[f];
  const strength = getPasswordStrength(form.password);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}>
      <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: 'var(--accent-2)' }} />
      <div className="absolute bottom-1/3 left-1/4 w-56 h-56 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: 'var(--accent-3)' }} />
      <div className="w-full max-w-sm relative z-10">
        <div className="glass rounded-2xl px-8 py-8 mb-3 animate-fade-up" style={{ borderRadius: '20px' }}>
          <div className="text-center mb-6">
            <h1 className="gradient-text font-bold mb-1"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.8rem' }}>
              Instagram
            </h1>
            <p className="font-semibold text-base" style={{ color: 'var(--text-secondary)' }}>
              Sign up to see photos from your friends.
            </p>
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
            <Field name="fullName" placeholder="Full Name"
              value={form.fullName} onChange={handleChange} onBlur={handleBlur}
              error={getError('fullName')} touched={touched.fullName} />
            <Field name="username" placeholder="Username"
              value={form.username} onChange={handleChange} onBlur={handleBlur}
              error={getError('username')} touched={touched.username} />

            {/* Password with strength */}
            <div className="mb-3">
              <div className="relative">
                <input name="password" type={showPass ? 'text' : 'password'}
                  placeholder="Password" value={form.password}
                  onChange={handleChange} onBlur={handleBlur} autoComplete="new-password"
                  className={`input-base w-full px-4 py-3 text-sm pr-16 ${touched.password && getError('password') ? 'input-error' : ''}`}
                  style={{ borderRadius: '10px' }}
                />
                <button type="button" onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold"
                  style={{ color: 'var(--accent-1)' }}>
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
              {touched.password && getError('password') && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1.5 pl-1">
                  <span>⚠</span> {getError('password')}
                </p>
              )}
              {/* Strength bar */}
              {touched.password && form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4,5].map((i) => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ background: i <= strength.score ? strength.color : 'var(--border)' }} />
                    ))}
                  </div>
                  <p className="text-xs pl-1" style={{ color: strength.color }}>
                    {strength.label}
                  </p>
                </div>
              )}
              {/* Checklist */}
              {touched.password && form.password && (
                <ul className="mt-2 space-y-1 pl-1">
                  {[
                    { rule: form.password.length >= 6,   text: 'At least 6 characters' },
                    { rule: /[A-Z]/.test(form.password), text: 'One uppercase letter' },
                    { rule: /[0-9]/.test(form.password), text: 'One number' },
                  ].map(({ rule, text }) => (
                    <li key={text} className="flex items-center gap-1.5 text-xs transition-colors"
                      style={{ color: rule ? '#34d399' : 'var(--text-muted)' }}>
                      <span>{rule ? '✓' : '○'}</span> {text}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
            By signing up, you agree to our <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Terms</span> &{' '}
            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Privacy Policy</span>.
          </p>
        </div>
        <div className="glass rounded-2xl px-8 py-4 text-center text-sm animate-fade-up stagger-1" style={{ borderRadius: '16px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Have an account? </span>
          <Link to="/login" className="font-semibold" style={{ color: 'var(--accent-1)' }}>Log in</Link>
        </div>
      </div>
    </div>
  );
}