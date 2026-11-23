import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { CommandPaletteProvider } from './components/CommandPalette';
import Splash from './components/ui/Splash';
import Login from './pages/Login';
import Home from './pages/Home';
import NotFound from './pages/NotFound';

// The editor pulls in TipTap, Yjs and DOCX tooling — load it only when needed.
const Editor = lazy(() => import('./pages/Editor'));

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  // Remember where the visitor was going (e.g. a shared doc link) for after sign-in.
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

export default function App() {
  const { loading } = useAuth();

  if (loading) return <Splash />;

  return (
    <CommandPaletteProvider>
      <Suspense fallback={<Splash />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doc/:id"
            element={
              <ProtectedRoute>
                <Editor />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </CommandPaletteProvider>
  );
}
