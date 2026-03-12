import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Zap, ArrowRight, User, Mail, Lock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const RULES = {
  name: [
    { test: v => v.trim().length >= 2, msg: 'At least 2 characters' },
    { test: v => v.trim().length <= 100, msg: 'Max 100 characters' },
    { test: v => /^[a-zA-Z\s'-]+$/.test(v.trim()), msg: 'Only letters, spaces, hyphens allowed' },
  ],
  email: [
    { test: v => v.trim().length > 0, msg: 'Email is required' },
    { test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), msg: 'Enter a valid email address' },
  ],
  password: [
    { test: v => v.length >= 8, msg: 'At least 8 characters' },
    { test: v => /[A-Z]/.test(v), msg: 'At least one uppercase letter' },
    { test: v => /[a-z]/.test(v), msg: 'At least one lowercase letter' },
    { test: v => /[0-9]/.test(v), msg: 'At least one number' },
  ],
};

function validate(field, value) {
  for (const rule of RULES[field]) {
    if (!rule.test(value)) return rule.msg;
  }
  return null;
}

function PasswordRule({ passed, label }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs transition-colors ${passed ? 'text-[#C8FF00]' : 'text-gray-500'}`}>
      {passed
        ? <CheckCircle size={11} className="shrink-0" />
        : <XCircle size={11} className="shrink-0" />}
      {label}
    </div>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({ name: null, email: null, password: null });
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
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

  const passwordRules = [
    { label: 'At least 8 characters', passed: form.password.length >= 8 },
    { label: 'One uppercase letter', passed: /[A-Z]/.test(form.password) },
    { label: 'One lowercase letter', passed: /[a-z]/.test(form.password) },
    { label: 'One number', passed: /[0-9]/.test(form.password) },
  ];

  const strengthScore = passwordRules.filter(r => r.passed).length;
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strengthScore];
  const strengthColor = ['', '#f87171', '#fb923c', '#facc15', '#C8FF00'][strengthScore];

  const isFormValid = () =>
    !validate('name', form.name) &&
    !validate('email', form.email) &&
    !validate('password', form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Touch all fields and validate
    const newErrors = {
      name: validate('name', form.name),
      email: validate('email', form.email),
      password: validate('password', form.password),
    };
    setErrors(newErrors);
    setTouched({ name: true, email: true, password: true });

    if (newErrors.name || newErrors.email || newErrors.password) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      toast.success('Account created! Welcome to TaskFlow');
      navigate('/dashboard');
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (apiErrors?.length) {
        // Map server validation back to fields
        apiErrors.forEach(e => {
          if (e.path && RULES[e.path]) {
            setErrors(p => ({ ...p, [e.path]: e.msg }));
          }
        });
        toast.error(apiErrors[0].msg);
      } else {
        toast.error(err.response?.data?.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full bg-[#111118] border rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm transition-colors focus:outline-none focus:ring-1 ${
      touched[field] && errors[field]
        ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20'
        : touched[field] && !errors[field]
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
        <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full blur-3xl"
          style={{ background: 'rgba(96,165,250,0.08)' }} />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full blur-2xl"
          style={{ background: 'rgba(200,255,0,0.06)' }} />

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
        <div className="relative space-y-5">
          <h2 className="text-5xl font-bold leading-tight text-white">
            Start organizing<br />
            <span style={{ color: '#60a5fa' }}>smarter.</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-sm leading-relaxed">
            Join thousands of teams using TaskFlow to ship projects faster and with less chaos.
          </p>
        </div>

        {/* Stats */}
        <div className="relative flex gap-10">
          {[['Free', 'To start'], ['Instant', 'Setup'], ['Secure', 'By design']].map(([val, label]) => (
            <div key={label}>
              <div className="text-2xl font-bold font-mono" style={{ color: '#60a5fa' }}>{val}</div>
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
            <h1 className="text-3xl font-bold text-white mb-2">Create account</h1>
            <p className="text-gray-500">Get started with TaskFlow for free</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Full Name
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  className={`${inputClass('name')} pl-10`}
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  required
                  autoFocus
                />
                {touched.name && !errors.name && form.name && (
                  <CheckCircle size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#C8FF00]" />
                )}
              </div>
              {touched.name && errors.name && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <XCircle size={11} /> {errors.name}
                </p>
              )}
            </div>

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
                  placeholder="Min 8 chars, uppercase & number"
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

              {/* Strength meter — shows once user starts typing */}
              {form.password.length > 0 && (
                <div className="mt-3 space-y-2">
                  {/* Bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i}
                          className="h-1.5 flex-1 rounded-full transition-all duration-300"
                          style={{ background: i <= strengthScore ? strengthColor : '#252535' }} />
                      ))}
                    </div>
                    {strengthLabel && (
                      <span className="text-xs font-semibold shrink-0 transition-colors"
                        style={{ color: strengthColor }}>
                        {strengthLabel}
                      </span>
                    )}
                  </div>

                  {/* Rules checklist */}
                  <div className="grid grid-cols-2 gap-1">
                    {passwordRules.map(r => (
                      <PasswordRule key={r.label} passed={r.passed} label={r.label} />
                    ))}
                  </div>
                </div>
              )}

              {touched.password && errors.password && !form.password.length && (
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
                  Creating account...
                </>
              ) : (
                <>Create account <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-medium transition-colors hover:opacity-80"
              style={{ color: '#C8FF00' }}>
              Sign in
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