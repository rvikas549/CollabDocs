import { Keyboard, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar } from './ui/Avatar';
import Dropdown from './ui/Dropdown';

export default function ProfileMenu({ onShowShortcuts }) {
  const { user, signOut } = useAuth();
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
      width={250}
      trigger={({ toggle }) => (
        <button type="button" className="profile-trigger" onClick={toggle} aria-label="Account menu">
          <Avatar name={user.displayName} src={user.photoURL} seed={user.uid} size={34} />
        </button>
      )}
    >
      {({ close }) => (
        <>
          <div className="profile-head">
            <Avatar name={user.displayName} src={user.photoURL} seed={user.uid} size={38} />
            <div style={{ minWidth: 0 }}>
              <div className="profile-name">{user.displayName}</div>
              <div className="profile-email">{user.email}</div>
            </div>
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
