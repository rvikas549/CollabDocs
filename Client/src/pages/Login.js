import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  EyeOff,
  FileText,
  Laptop,
  Lock,
  Mail,
  MousePointer2,
  ServerCrash,
  Sparkles,
  User,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiError } from '../config/api';
import { API_URL } from '../config/env';
import Logo from '../components/ui/Logo';
import LiveDemo from '../components/LiveDemo';
import ThemeToggle from '../components/ThemeToggle';
import '../styles/login.css';

const FIREBASE_ERRORS = {
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'No account found with that email.',
  'auth/email-already-in-use': 'An account with this email already exists — try signing in.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error — check your connection.',
  'auth/popup-blocked': 'Your browser blocked the sign-in popup. Allow pop-ups and try again.',
  'auth/unauthorized-domain': 'This domain is not authorised in Firebase (Authentication → Settings → Authorised domains).',
  'auth/popup-closed-by-user': null,
  'auth/cancelled-popup-request': null,
};

function friendlyError(err) {
  if (err?.code && err.code in FIREBASE_ERRORS) return FIREBASE_ERRORS[err.code];
  if (err?.isAxiosError) return apiError(err);
  return err?.message || 'Something went wrong.';
}

function passwordStrength(pw) {
  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score += 1;
  return score;
}

const STRENGTH_LABEL = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'];

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.3 0-9.8-3.3-11.5-8l-6.5 5C9.5 39.5 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3-3.4 5.4-6.3 6.9l6.3 5.3C39.7 36.6 44 30.8 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export default function Login() {
  const { user, capabilities, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, signInDev } = useAuth();
  const location = useLocation();
  const toast = useToast();

  const [mode, setMode] = useState('signin'); // signin | signup | reset
  const [useDev, setUseDev] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);

  if (user) {
    const from = location.state?.from;
    return <Navigate to={from ? `${from.pathname}${from.search || ''}` : '/'} replace />;
  }

  const showFirebase = capabilities.firebase && !useDev;
  const showDev = !showFirebase && capabilities.dev;

  const run = async (key, fn) => {
    setError('');
    setBusy(key);
    try {
      await fn();
    } catch (err) {
      const message = friendlyError(err);
      if (message) setError(message);
    } finally {
      setBusy(null);
    }
  };

  const onEmailSubmit = (event) => {
    event.preventDefault();
    if (mode === 'reset') {
      run('email', async () => {
        await resetPassword(email);
        toast.success('Password reset link sent — check your inbox.');
        setMode('signin');
      });
      return;
    }
    run('email', () => (mode === 'signup' ? signUpWithEmail(name.trim(), email, password) : signInWithEmail(email, password)));
  };

  const onDevSubmit = (event) => {
    event.preventDefault();
    run('dev', () => signInDev(name.trim(), email.trim()));
  };

  const switchMode = (next) => {
    setMode(next);
    setError('');
  };

  const onSpotlight = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty('--my', `${event.clientY - rect.top}px`);
  };

  const strength = passwordStrength(password);
  const headings = {
    signin: ['Welcome back', 'Sign in to pick up where your team left off.'],
    signup: ['Create your account', 'Start writing together in under a minute.'],
    reset: ['Reset your password', "We'll email you a secure link."],
  };

  return (
    <div className="auth">
      <div className="aurora" aria-hidden="true">
        <span className="aurora-blob aurora-blob--1" />
        <span className="aurora-blob aurora-blob--2" />
        <span className="aurora-blob aurora-blob--3" />
        <span className="aurora-grid" />
      </div>

      <div className="auth-top">
        <Logo withText size={36} />
        <ThemeToggle />
      </div>

      <div className="auth-grid">
        <section className="auth-hero">
          <span className="eyebrow animate-fade-up">
            <Sparkles /> Realtime collaboration, reimagined
          </span>
          <h1 className="display auth-title animate-fade-up" style={{ '--i': 1 }}>
            Write together,
            <br />
            <em className="text-gradient">in real time.</em>
          </h1>
          <p className="auth-lead animate-fade-up" style={{ '--i': 2 }}>
            Live cursors, instant sync and beautiful documents — right in your browser. No refresh, no conflicts,
            no “final_v7_REAL.docx”.
          </p>

          <div className="animate-fade-up" style={{ '--i': 3 }}>
            <LiveDemo />
          </div>

          <ul className="auth-features animate-fade-up" style={{ '--i': 4 }}>
            <li>
              <MousePointer2 /> Live cursors
            </li>
            <li>
              <Zap /> CRDT sync
            </li>
            <li>
              <FileText /> DOCX in &amp; out
            </li>
            <li>
              <Sparkles /> Templates
            </li>
          </ul>
        </section>

        <section className="auth-panel">
          <div className="auth-card animate-fade-up" style={{ '--i': 2 }} onPointerMove={onSpotlight}>
            {!capabilities.checked && (
              <div className="auth-loading">
                <span className="spinner" /> Connecting to the server…
              </div>
            )}

            {capabilities.checked && showFirebase && (
              <>
                <h2 className="auth-card__title">{headings[mode][0]}</h2>
                <p className="auth-card__sub">{headings[mode][1]}</p>

                {!capabilities.firebaseOnServer && (
                  <div className="auth-note auth-note--warn">
                    The API server has no Firebase Admin credentials yet, so requests will be rejected. Fill in the
                    FIREBASE_* values in <code>Server/.env</code>.
                  </div>
                )}

                {mode !== 'reset' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary btn-lg btn-block google-btn"
                      onClick={() => run('google', signInWithGoogle)}
                      disabled={!!busy}
                    >
                      {busy === 'google' ? <span className="spinner" /> : <GoogleIcon />}
                      Continue with Google
                    </button>
                    <div className="auth-divider">
                      <span>or with email</span>
                    </div>
                  </>
                )}

                <form className="auth-form" onSubmit={onEmailSubmit}>
                  {mode === 'signup' && (
                    <div className="input-wrap">
                      <User />
                      <input
                        className="input"
                        placeholder="Full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        required
                      />
                    </div>
                  )}

                  <div className="input-wrap">
                    <Mail />
                    <input
                      className="input"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>

                  {mode !== 'reset' && (
                    <div className="input-wrap">
                      <Lock />
                      <input
                        className="input"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        className="icon-btn icon-btn-sm input-action"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  )}

                  {mode === 'signup' && password && (
                    <div className="strength" data-score={strength}>
                      <div className="strength-bars">
                        {[1, 2, 3, 4].map((n) => (
                          <span key={n} className={strength >= n ? 'is-on' : ''} />
                        ))}
                      </div>
                      <span>{STRENGTH_LABEL[strength]}</span>
                    </div>
                  )}

                  {mode === 'signin' && (
                    <button type="button" className="link-btn auth-forgot" onClick={() => switchMode('reset')}>
                      Forgot password?
                    </button>
                  )}

                  {error && <div className="auth-error">{error}</div>}

                  <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={!!busy}>
                    {busy === 'email' && <span className="spinner" />}
                    {mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}
                    {!busy && <ArrowRight />}
                  </button>
                </form>

                <p className="auth-switch">
                  {mode === 'signin' ? (
                    <>
                      New to CollabDocs?{' '}
                      <button type="button" className="link-btn" onClick={() => switchMode('signup')}>
                        Create an account
                      </button>
                    </>
                  ) : (
                    <>
                      {mode === 'signup' ? 'Already have an account?' : 'Remembered it?'}{' '}
                      <button type="button" className="link-btn" onClick={() => switchMode('signin')}>
                        Sign in
                      </button>
                    </>
                  )}
                </p>

                {capabilities.dev && (
                  <button type="button" className="auth-alt" onClick={() => setUseDev(true)}>
                    <Laptop /> Use a local dev account instead
                  </button>
                )}
              </>
            )}

            {capabilities.checked && showDev && (
              <>
                <span className="badge badge-brand" style={{ marginBottom: 14 }}>
                  <Laptop /> Local workspace
                </span>
                <h2 className="auth-card__title">Jump right in</h2>
                <p className="auth-card__sub">Pick a display name — that's how collaborators will see your cursor.</p>

                <form className="auth-form" onSubmit={onDevSubmit}>
                  <div className="input-wrap">
                    <User />
                    <input
                      className="input"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      autoFocus
                      required
                      minLength={2}
                    />
                  </div>
                  <div className="input-wrap">
                    <Mail />
                    <input
                      className="input"
                      type="email"
                      placeholder="Email (optional)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>

                  {error && <div className="auth-error">{error}</div>}

                  <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={!!busy}>
                    {busy === 'dev' && <span className="spinner" />}
                    Enter workspace
                    {!busy && <ArrowRight />}
                  </button>
                </form>

                <div className="auth-note">
                  {capabilities.firebase ? (
                    <button type="button" className="link-btn" onClick={() => setUseDev(false)}>
                      ← Back to Google / email sign-in
                    </button>
                  ) : (
                    <>
                      <strong>Dev mode.</strong> Firebase keys aren't set, so you're using a local account. Add them to{' '}
                      <code>Client/.env</code> to enable Google sign-in.
                    </>
                  )}
                </div>
                <p className="auth-tip">
                  💡 Tip: open the same document in another browser with a different name to watch live cursors.
                </p>
              </>
            )}

            {capabilities.checked && !showFirebase && !showDev && (
              <div className="auth-empty">
                <div className="modal-icon danger">
                  <ServerCrash />
                </div>
                <h2 className="auth-card__title">
                  {capabilities.serverReachable ? 'No sign-in method configured' : "Can't reach the server"}
                </h2>
                <p className="auth-card__sub">
                  {capabilities.serverReachable ? (
                    <>
                      Add Firebase keys to <code>Client/.env</code> and <code>Server/.env</code>, or set{' '}
                      <code>DEV_AUTH=true</code> in <code>Server/.env</code> for local development.
                    </>
                  ) : (
                    <>
                      The API at <code>{API_URL}</code> isn't responding. Start it with <code>npm run dev</code> in the{' '}
                      <code>Server</code> folder, then refresh.
                    </>
                  )}
                </p>
                <button type="button" className="btn btn-secondary" onClick={() => window.location.reload()}>
                  Try again
                </button>
              </div>
            )}
          </div>

          <p className="auth-legal">
            {showFirebase ? 'Secured by Firebase Auth · ' : ''}Realtime sync powered by Yjs CRDTs
          </p>
        </section>
      </div>
    </div>
  );
}
