import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { FIREBASE_ENABLED } from '../config/env';
import api, { configureAuth } from '../config/api';

const DEV_SESSION_KEY = 'collabdocs.devSession';
const AuthContext = createContext(null);

function readDevSession() {
  try {
    const session = JSON.parse(localStorage.getItem(DEV_SESSION_KEY));
    if (!session?.token || !session?.user) return null;

    const payload = JSON.parse(atob(session.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;

    return session;
  } catch {
    return null;
  }
}

const fromFirebase = (u) => ({
  uid: u.uid,
  displayName: u.displayName || u.email?.split('@')[0] || 'Anonymous',
  email: u.email,
  photoURL: u.photoURL,
  provider: 'firebase',
});

const fromDev = (s) => ({
  uid: s.user.uid,
  displayName: s.user.name,
  email: s.user.email,
  photoURL: s.user.picture || null,
  provider: 'dev',
});

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [firebaseReady, setFirebaseReady] = useState(!FIREBASE_ENABLED);
  const [devSession, setDevSession] = useState(readDevSession);
  const [profileVersion, setProfileVersion] = useState(0);
  const [serverModes, setServerModes] = useState(null);

  const devSessionRef = useRef(devSession);
  devSessionRef.current = devSession;

  const clearDevSession = useCallback(() => {
    try {
      localStorage.removeItem(DEV_SESSION_KEY);
    } catch {
      /* ignore */
    }
    setDevSession(null);
  }, []);

  /** Always resolves to a valid token (Firebase refreshes it when close to expiry). */
  const getToken = useCallback(async (forceRefresh = false) => {
    if (auth?.currentUser) return auth.currentUser.getIdToken(forceRefresh);
    return devSessionRef.current?.token || null;
  }, []);

  // Configure synchronously so the very first request already carries the token.
  configureAuth({
    getToken,
    onUnauthorized: () => {
      // A dev token stops working when the server's secret changes — sign out cleanly.
      if (devSessionRef.current && !auth?.currentUser) clearDevSession();
    },
  });

  useEffect(() => {
    if (!FIREBASE_ENABLED) return undefined;
    return onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      setFirebaseReady(true);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/auth/config')
      .then((res) => !cancelled && setServerModes({ ...res.data, reachable: true }))
      .catch(() => !cancelled && setServerModes({ firebase: false, dev: false, reachable: false }));
    return () => {
      cancelled = true;
    };
  }, []);

  const user = useMemo(() => {
    if (firebaseUser) return fromFirebase(firebaseUser);
    if (devSession) return fromDev(devSession);
    return null;
    // profileVersion forces a refresh after updateProfile mutates the Firebase user in place.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser, devSession, profileVersion]);

  const signInWithGoogle = useCallback(() => signInWithPopup(auth, googleProvider), []);

  const signInWithEmail = useCallback((email, password) => signInWithEmailAndPassword(auth, email, password), []);

  const signUpWithEmail = useCallback(async (name, email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    await result.user.getIdToken(true); // new token now contains the display name
    setProfileVersion((v) => v + 1);
  }, []);

  const resetPassword = useCallback((email) => sendPasswordResetEmail(auth, email), []);

  const signInDev = useCallback(async (name, email) => {
    const { data } = await api.post('/auth/dev-login', { name, email });
    localStorage.setItem(DEV_SESSION_KEY, JSON.stringify(data));
    setDevSession(data);
  }, []);

  const signOut = useCallback(async () => {
    if (auth?.currentUser) await firebaseSignOut(auth);
    clearDevSession();
  }, [clearDevSession]);

  const value = useMemo(
    () => ({
      user,
      loading: !firebaseReady,
      getToken,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      resetPassword,
      signInDev,
      signOut,
      capabilities: {
        checked: serverModes !== null,
        serverReachable: serverModes?.reachable ?? true,
        firebase: FIREBASE_ENABLED,
        firebaseOnServer: serverModes?.firebase ?? true,
        dev: Boolean(serverModes?.dev),
      },
    }),
    [user, firebaseReady, getToken, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, signInDev, signOut, serverModes]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
