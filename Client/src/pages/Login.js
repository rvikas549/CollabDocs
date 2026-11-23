import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiError } from '../config/api';
import { API_URL } from '../config/env';
import Logo from '../components/ui/Logo';
import '../styles/login.css';

const FIREBASE_ERRORS = {
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'No account found with that email.',
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'auth/popup-blocked': 'The sign-in popup was blocked. Please allow pop-ups.',
  'auth/unauthorized-domain': 'This domain is not authorized in Firebase.',
  'auth/popup-closed-by-user': null,
  'auth/cancelled-popup-request': null,
};

function friendlyError(err) {
  if (err?.code && err.code in FIREBASE_ERRORS) return FIREBASE_ERRORS[err.code];
  if (err?.isAxiosError) return apiError(err);
  return err?.message || 'Something went wrong.';
}

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
        toast.success('Password reset email sent.');
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

  const headings = {
    signin: 'Sign in to your account',
    signup: 'Create an account',
    reset: 'Reset your password',
  };

  return (
    <div className="auth">
      <div className="auth-card card">
        <div className="auth-brand">
          <Logo withText size={34} />
        </div>

        {!capabilities.checked && (
          <div className="auth-loading">
            <span className="spinner" /> Connecting to server...
          </div>
        )}

        {capabilities.checked && showFirebase && (
          <>
            <h2 className="auth-title">{headings[mode]}</h2>

            {mode !== 'reset' && (
              <>
                <button
                  type="button"
                  className="btn btn-secondary btn-lg btn-block"
                  onClick={() => run('google', signInWithGoogle)}
                  disabled={!!busy}
                >
                  {busy === 'google' ? <span className="spinner" /> : <GoogleIcon />}
                  Continue with Google
                </button>
                <div className="auth-divider">or</div>
              </>
            )}

            <form className="auth-form" onSubmit={onEmailSubmit}>
              {mode === 'signup' && (
                <label className="field">
                  <span className="field-label">Name</span>
                  <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
                </label>
              )}

              <label className="field">
                <span className="field-label">Email</span>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </label>

              {mode !== 'reset' && (
                <label className="field">
                  <span className="field-label">Password</span>
                  <span className="input-wrap">
                    <input
                      className="input"
                      type={showPassword ? 'text' : 'password'}
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
                  </span>
                </label>
              )}

              {mode === 'signin' && (
                <button type="button" className="link-btn auth-forgot" onClick={() => switchMode('reset')}>
                  Forgot password?
                </button>
              )}

              {error && <div className="auth-error">{error}</div>}

              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={!!busy}>
                {busy === 'email' && <span className="spinner" />}
                {mode === 'signup' ? 'Sign up' : mode === 'reset' ? 'Send reset link' : 'Sign in'}
              </button>
            </form>

            <p className="auth-switch">
              {mode === 'signin' ? (
                <>
                  Don't have an account?{' '}
                  <button type="button" className="link-btn" onClick={() => switchMode('signup')}>
                    Sign up
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
              <p className="auth-switch">
                <button type="button" className="link-btn" onClick={() => setUseDev(true)}>
                  Use local dev login
                </button>
              </p>
            )}
          </>
        )}

        {capabilities.checked && showDev && (
          <>
            <h2 className="auth-title">Local dev login</h2>
            <p className="auth-sub">Enter a name to continue. This is only available in development.</p>

            <form className="auth-form" onSubmit={onDevSubmit}>
              <label className="field">
                <span className="field-label">Name</span>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  autoFocus
                  required
                  minLength={2}
                />
              </label>
              <label className="field">
                <span className="field-label">Email (optional)</span>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </label>

              {error && <div className="auth-error">{error}</div>}

              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={!!busy}>
                {busy === 'dev' && <span className="spinner" />}
                Continue
              </button>
            </form>

            {capabilities.firebase && (
              <p className="auth-switch">
                <button type="button" className="link-btn" onClick={() => setUseDev(false)}>
                  Back to normal sign in
                </button>
              </p>
            )}
          </>
        )}

        {capabilities.checked && !showFirebase && !showDev && (
          <>
            <h2 className="auth-title">{capabilities.serverReachable ? 'Sign in is not configured' : 'Cannot reach the server'}</h2>
            <p className="auth-sub">
              {capabilities.serverReachable
                ? 'Add the Firebase settings to the .env files and restart.'
                : `The API at ${API_URL} is not responding. Please try again in a moment.`}
            </p>
            <button type="button" className="btn btn-secondary btn-block" onClick={() => window.location.reload()}>
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
