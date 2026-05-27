import { useState, useEffect } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();

  const { user } = useAuth();

  const [isSignup, setIsSignup] = useState(false);

  const [name, setName] = useState('');

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [error, setError] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // ─── Google Login ─────────────────────────────

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  // ─── Email/Password Auth ──────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        const res = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Save display name
        await updateProfile(res.user, {
          displayName: name,
        });
      } else {
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
      }

      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background:
          'linear-gradient(135deg, #e8f0fe, #f8f9fa)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div
        style={{
          width: 380,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(10px)',
          padding: 36,
          borderRadius: 20,
          boxShadow:
            '0 10px 40px rgba(0,0,0,0.08)',
          border: '1px solid rgba(255,255,255,0.4)',
        }}
      >
        <h1
          style={{
            textAlign: 'center',
            color: '#1a73e8',
            marginBottom: 8,
            fontSize: 34,
            fontWeight: 700,
          }}
        >
          CollabDocs
        </h1>
        {/* <p
          style={{
            textAlign: 'center',
            color: '#666',
            marginBottom: 28,
            fontSize: 15,
          }}
        >
          Realtime collaborative workspace
        </p> */}
        {/* <h1
          style={{
            textAlign: 'center',
            color: '#1a73e8',
            marginBottom: 8,
          }}
        >
          CollabDocs
        </h1> */}

        <p
          style={{
            textAlign: 'center',
            color: '#777',
            marginBottom: 24,
          }}
        >
          {isSignup ? 'Create account' : 'Sign in'}
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {isSignup && (
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={inputStyle}
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />

          {error && (
            <p
              style={{
                color: 'red',
                fontSize: 12,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={buttonStyle}
          >
            {loading
              ? 'Please wait...'
              : isSignup
              ? 'Create account'
              : 'Sign in'}
          </button>
        </form>

        <div
          style={{
            margin: '20px 0',
            textAlign: 'center',
            color: '#999',
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            gap: 12,
            fontSize: 14,
          }}
        >
          OR
          <button
            onClick={handleGoogleLogin}
            style={{
              ...buttonStyle,
              background: '#fff',
              color: '#333',
              border: '1px solid #ddd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              fontWeight: 500,
            }}
          >
            {/* Google SVG */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              width="20px"
              height="20px"
            >
              <path
                fill="#FFC107"
                d="M43.6,20.5H42V20H24v8h11.3
      C33.7,32.7,29.3,36,24,36
      c-6.6,0-12-5.4-12-12
      s5.4-12,12-12
      c3.1,0,5.9,1.2,8,3.1
      l5.7-5.7C34.1,6.1,29.3,4,24,4
      C12.9,4,4,12.9,4,24
      s8.9,20,20,20
      s20-8.9,20-20
      C44,22.7,43.9,21.6,43.6,20.5z"
              />

              <path
                fill="#FF3D00"
                d="M6.3,14.7l6.6,4.8
      C14.7,16.1,19,13,24,13
      c3.1,0,5.9,1.2,8,3.1
      l5.7-5.7C34.1,6.1,29.3,4,24,4
      C16.3,4,9.7,8.3,6.3,14.7z"
              />

              <path
                fill="#4CAF50"
                d="M24,44c5.2,0,10-2,
      13.6-5.2l-6.3-5.3
      C29.2,35.1,26.7,36,24,36
      c-5.3,0-9.8-3.3-11.5-8
      l-6.5,5C9.5,39.5,16.2,44,24,44z"
              />

              <path
                fill="#1976D2"
                d="M43.6,20.5H42V20H24v8h11.3
      c-1.1,3-3.4,5.4-6.3,6.9
      l6.3,5.3C39.7,36.6,44,30.8,44,24
      C44,22.7,43.9,21.6,43.6,20.5z"
              />
            </svg>

            Continue with Google
          </button>
        {/* <button
          onClick={handleGoogleLogin}
          style={{
            ...buttonStyle,
            background: '#fff',
            color: '#333',
            border: '1px solid #ddd',
          }}
        >
          Continue with Google
        </button> */}
        </div>
        <p
          style={{
            marginTop: 20,
            textAlign: 'center',
            fontSize: 14,
          }}
        >
          {isSignup
            ? 'Already have an account?'
            : "Don't have an account?"}

          <span
            onClick={() => setIsSignup(!isSignup)}
            style={{
              color: '#1a73e8',
              cursor: 'pointer',
              marginLeft: 6,
            }}
          >
            {isSignup ? 'Sign in' : 'Sign up'}
          </span>
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '12px',
  borderRadius: 8,
  border: '1px solid #ddd',
  fontSize: 14,
};

const buttonStyle = {
  padding: '13px',
  borderRadius: 12,
  border: 'none',
  background: '#1a73e8',
  color: '#fff',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  transition: '0.2s',
};

// const buttonStyle = {
//   padding: '12px',
//   borderRadius: 8,
//   border: 'none',
//   background: '#1a73e8',
//   color: '#fff',
//   fontSize: 15,
//   cursor: 'pointer',
// };