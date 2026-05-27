import { useState, useRef, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
export default function ProfileMenu({
  user,
}) {
  const [open, setOpen] = useState(false);

  const menuRef = useRef();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: 'relative',
        justifyContent: 'flex-end'
      }}
    >
      {/* Avatar */}
      <img
        src={user?.photoURL}
        alt="profile"
        onClick={() => setOpen(!open)}
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          cursor: 'pointer',
          objectFit: 'cover',
          border: '2px solid #e0e0e0',
        }}
      />

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 50,
            width: 240,
            background: '#fff',
            borderRadius: 14,
            boxShadow:
              '0 10px 30px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            zIndex: 999,
          }}
        >
          {/* User Info */}
          <div
            style={{
              padding: 18,
              borderBottom:
                '1px solid #f0f0f0',
            }}
          >
            <div
              style={{
                fontWeight: 600,
                color: '#202124',
                marginBottom: 4,
              }}
            >
              {user?.displayName}
            </div>

            <div
              style={{
                fontSize: 13,
                color: '#666',
              }}
            >
              {user?.email}
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '14px 18px',
              border: 'none',
              background: 'white',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: 14,
              color: '#d93025',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                '#f8f9fa';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                'white';
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}