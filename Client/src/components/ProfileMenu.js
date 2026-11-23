import { Keyboard, LogOut, Monitor, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Avatar } from './ui/Avatar';
import Dropdown from './ui/Dropdown';

const THEMES = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'Auto', icon: Monitor },
];

export default function ProfileMenu({ onShowShortcuts }) {
  const { user, signOut } = useAuth();
  const { preference, setPreference } = useTheme();
  const toast = useToast();

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Dropdown
      width={270}
      trigger={({ toggle, open }) => (
        <button type="button" className={`profile-trigger ${open ? 'is-open' : ''}`} onClick={toggle} aria-label="Account menu">
          <Avatar name={user.displayName} src={user.photoURL} seed={user.uid} size={34} />
        </button>
      )}
    >
      {({ close }) => (
        <>
          <div className="profile-head">
            <Avatar name={user.displayName} src={user.photoURL} seed={user.uid} size={42} />
            <div style={{ minWidth: 0 }}>
              <div className="profile-name">{user.displayName}</div>
              <div className="profile-email">{user.email}</div>
              <span className="badge" style={{ marginTop: 6 }}>
                {user.provider === 'dev' ? 'Local dev account' : 'Firebase account'}
              </span>
            </div>
          </div>

          <div className="menu-sep" />
          <div className="menu-label">Appearance</div>
          <div className="segmented" role="radiogroup" aria-label="Theme">
            {THEMES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={preference === id}
                className={preference === id ? 'is-active' : ''}
                onClick={() => setPreference(id)}
              >
                <Icon />
                {label}
              </button>
            ))}
          </div>

          <div className="menu-sep" />
          {onShowShortcuts && (
            <button
              type="button"
              className="menu-item"
              onClick={() => {
                close();
                onShowShortcuts();
              }}
            >
              <Keyboard /> Keyboard shortcuts
            </button>
          )}
          <button type="button" className="menu-item danger" onClick={handleSignOut}>
            <LogOut /> Sign out
          </button>
        </>
      )}
    </Dropdown>
  );
}
