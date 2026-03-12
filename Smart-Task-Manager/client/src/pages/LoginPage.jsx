import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Zap, ArrowRight, Lock, Mail, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const RULES = {
  email: [
    { test: v => v.trim().length > 0, msg: 'Email is required' },
    { test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), msg: 'Enter a valid email address' },
  ],
  password: [
    { test: v => v.length > 0, msg: 'Password is required' },
    { test: v => v.length >= 8, msg: 'Password must be at least 8 characters' },
  ],
};

function validate(field, value) {
  for (const rule of RULES[field]) {
    if (!rule.test(value)) return rule.msg;
  }
  return null;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: null, password: null });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm(p => ({ ...p, [field]: value }));
    if (touched[field]) {
      setErrors(p => ({ ...p, [field]: validate(field, value) }));
    }
  };

  const handleBlur = (field) => {
    setTouched(p => ({ ...p, [field]: true }));
    setErrors(p => ({ ...p, [field]: validate(field, form[field]) }));
  };

  const fillDemo = (role) => {
    const creds = {
      superadmin: { email: 'superadmin@taskmanager.com', password: 'SuperAdmin@123' },
    };
    if (creds[role]) {
      setForm(creds[role]);
      // Mark as touched + valid when autofilled
      setTouched({ email: true, password: true });
      setErrors({ email: null, password: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {
      email: validate('email', form.email),
      password: validate('password', form.password),
    };
    setErrors(newErrors);
    setTouched({ email: true, password: true });

    if (newErrors.email || newErrors.password) {
      toast.error('Please fix the errors before signing in');
      return;
    }

    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      // Map server error to correct field
      if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('credentials')) {
        setErrors(p => ({ ...p, email: 'Invalid email or password' }));
        setErrors(p => ({ ...p, password: 'Invalid email or password' }));
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full bg-[#111118] border rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm transition-colors focus:outline-none focus:ring-1 ${
      touched[field] && errors[field]
        ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20'
        : touched[field] && !errors[field] && form[field]
        ? 'border-[#C8FF00]/40 focus:border-[#C8FF00] focus:ring-[#C8FF00]/20'
        : 'border-[#343448] focus:border-[#C8FF00] focus:ring-[#C8FF00]/20'
    }`;

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: '#0A0A0F' }}>

      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: '#111118' }}>
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(#C8FF00 1px, transparent 1px), linear-gradient(90deg, #C8FF00 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl"
          style={{ background: 'rgba(200,255,0,0.06)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full blur-3xl"
          style={{ background: 'rgba(96,165,250,0.08)' }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-[#C8FF00] rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-[#0A0A0F]" fill="currentColor" />
          </div>
          <div>
            <div className="font-bold text-white text-xl">TaskFlow</div>
            <div className="text-xs text-gray-500 font-mono">Smart Task Manager</div>
          </div>
        </div>

        {/* Tagline */}
        <div className="relative space-y-6">
          <h2 className="text-5xl font-bold leading-tight text-white">
            Manage tasks<br />
            <span style={{ color: '#C8FF00' }}>brilliantly.</span>
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
            Role-based access, smart filtering, and real-time collaboration for teams of every size.
          </p>
          <div className="flex flex-wrap gap-2">
            {['Role-Based Access', 'Task Assignments', 'Priority Management', 'Admin Controls'].map(f => (
              <span key={f}
                className="text-xs px-3 py-1.5 rounded-lg border font-medium"
                style={{ background: 'rgba(255,255,255,0.04)', borderColor: '#343448', color: '#9ca3af' }}>
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="relative flex gap-10">
          {[['3', 'User roles'], ['∞', 'Tasks'], ['100%', 'Secure']].map(([val, label]) => (
            <div key={label}>
              <div className="text-2xl font-bold font-mono" style={{ color: '#C8FF00' }}>{val}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md" style={{ animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards' }}>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-9 h-9 bg-[#C8FF00] rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-[#0A0A0F]" fill="currentColor" />
            </div>
            <span className="font-bold text-white text-xl">TaskFlow</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
            <p className="text-gray-500">Sign in to your account to continue</p>
          </div>

          {/* Demo credentials */}
          <div className="mb-6 p-4 rounded-xl border" style={{ background: '#1A1A25', borderColor: '#343448' }}>
            <p className="text-xs text-gray-500 mb-3 font-mono uppercase tracking-wider">Quick demo access</p>
            <button
              type="button"
              onClick={() => fillDemo('superadmin')}
              className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-sm group"
              style={{ background: '#252535' }}
              onMouseEnter={e => e.currentTarget.style.background = '#343448'}
              onMouseLeave={e => e.currentTarget.style.background = '#252535'}>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-md font-semibold"
                  style={{ background: 'rgba(200,255,0,0.15)', color: '#C8FF00', border: '1px solid rgba(200,255,0,0.25)' }}>
                  Superadmin
                </span>
                <span className="text-gray-500 font-mono text-xs">superadmin@taskmanager.com</span>
              </div>
              <ArrowRight size={14} className="text-gray-500 group-hover:text-gray-300 transition-colors" />
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type="email"
                  className={`${inputClass('email')} pl-10`}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  required
                  autoFocus
                />
                {touched.email && !errors.email && form.email && (
                  <CheckCircle size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#C8FF00]" />
                )}
              </div>
              {touched.email && errors.email && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <XCircle size={11} /> {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`${inputClass('password')} pl-10 pr-10`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <XCircle size={11} /> {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full font-semibold px-5 py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{ background: '#C8FF00', color: '#0A0A0F' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#AEDE00'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#C8FF00'; }}>
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 rounded-full animate-spin"
                    style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#0A0A0F' }} />
                  Signing in...
                </>
              ) : (
                <>Sign in <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium transition-colors hover:opacity-80"
              style={{ color: '#C8FF00' }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}