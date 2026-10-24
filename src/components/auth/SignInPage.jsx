import { useState } from 'react';
import { ArrowRight, Compass, GraduationCap, ClipboardCheck, Building2, Eye, EyeOff } from 'lucide-react';
import { usePlanStore } from '../../store/usePlanStore.js';
import { ROLES } from '../../brain/student.js';
import { Footer } from '../layout/Footer.jsx';

const ROLE_ICONS = { newcomer: Compass, student: GraduationCap, advisor: ClipboardCheck, admin: Building2 };
const ROLE_ACCENT = {
  newcomer: 'peer-checked:border-amber-500 peer-checked:bg-amber-50 text-amber-700',
  student: 'peer-checked:border-blue-600 peer-checked:bg-blue-50 text-blue-700',
  advisor: 'peer-checked:border-emerald-700 peer-checked:bg-emerald-50 text-emerald-700',
  admin: 'peer-checked:border-slate-700 peer-checked:bg-slate-100 text-slate-700',
};

/**
 * Entry page: choose who you are, then sign in or create an account. Choosing the role
 * here decides which workspace opens, so nobody has to switch roles after signing in.
 * Prototype: nothing is sent anywhere; any password works.
 */
export function SignInPage() {
  const signIn = usePlanStore((s) => s.signIn);
  const toast = usePlanStore((s) => s.toast);
  const [mode, setMode] = useState('signin');
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(ROLES.student.demo.email);
  const [password, setPassword] = useState('demo-password');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const chooseRole = (id) => {
    setRole(id);
    setEmail(ROLES[id].demo.email);
    setName('');
    setError('');
  };

  const submit = (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter an email address like name@example.com.');
    if (password.length < 6) return setError('Your password needs at least 6 characters.');
    if (mode === 'signup' && !name.trim()) return setError('Enter your name so we know what to call you.');
    setError('');
    signIn(role, { name: name.trim() || undefined, email });
    if (mode === 'signup') toast('Account created. Welcome to UniTranslate!', 'success');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <main id="main-content" tabIndex={-1} className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 grid gap-8 lg:grid-cols-[1fr_26rem] lg:items-start">
        <section className="space-y-6">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center" aria-hidden>
                <GraduationCap className="w-5 h-5" />
              </span>
              UniTranslate
            </p>
            <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-slate-900 text-balance">Plan your studies around where you want to go.</h1>
            <p className="mt-3 text-slate-600 max-w-xl">
              Explore courses, start from a career goal, and build a timetable without clashes. One place for students, advisors and the department.
            </p>
          </div>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-900 mb-2">I am a…</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(ROLES).map(([id, r]) => {
                const Icon = ROLE_ICONS[id];
                return (
                  <label key={id} className="relative cursor-pointer">
                    <input type="radio" name="role" value={id} checked={role === id} onChange={() => chooseRole(id)} className="peer sr-only" />
                    <span
                      className={`flex h-full gap-3 rounded-xl border-2 border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 ${ROLE_ACCENT[id]}`}
                    >
                      <Icon className="w-6 h-6 shrink-0 mt-0.5" aria-hidden />
                      <span>
                        <span className="block font-semibold text-slate-900">{r.label}</span>
                        <span className="block text-sm text-slate-600 mt-0.5">{r.description}</span>
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6" aria-labelledby="auth-title">
          <div className="grid grid-cols-2 gap-1 bg-slate-100 rounded-lg p-1 mb-5" role="tablist" aria-label="Sign in or create an account">
            {[
              ['signin', 'Sign in'],
              ['signup', 'Create account'],
            ].map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={mode === id}
                onClick={() => {
                  setMode(id);
                  setError('');
                }}
                className={`py-2 rounded-md text-sm font-medium ${mode === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <h2 id="auth-title" className="text-lg font-bold text-slate-900">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            {mode === 'signin' ? 'Signing in as' : 'Joining as'} <strong>{ROLES[role].label.toLowerCase()}</strong>.
          </p>

          <form onSubmit={submit} className="space-y-3" noValidate>
            {mode === 'signup' && (
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Full name</span>
                <input
                  id="auth-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder={ROLES[role].demo.name}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
            )}
            <label className="block">
              <span className="text-sm font-medium text-slate-700">{role === 'newcomer' ? 'Email' : 'University email'}</span>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <span className="relative block mt-1">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-800"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" aria-hidden /> : <Eye className="w-4 h-4" aria-hidden />}
                </button>
              </span>
            </label>

            {mode === 'signin' && (
              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2 text-slate-600">
                  <input type="checkbox" defaultChecked className="accent-blue-600" /> Keep me signed in
                </label>
                <button type="button" onClick={() => toast('Password reset is not available in this prototype.')} className="text-blue-600 hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg">
              {mode === 'signin' ? 'Sign in' : 'Create account'} <ArrowRight className="w-4 h-4" aria-hidden />
            </button>
            <p className="text-xs text-slate-500 text-center">Prototype: demo accounts are pre-filled and no data leaves this device.</p>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}
