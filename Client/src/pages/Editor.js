import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import axios from 'axios';
import CollaborativeEditor from '../components/CollaborativeEditor';
import ProfileMenu from '../components/ProfileMenu';
import EditorToolbar from '../components/EditorToolbar';

export default function Editor() {
  const { id: docId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const socketRef = useRef(null);
  const [title, setTitle] = useState(
    'Untitled document'
  );
  const [roomUsers, setRoomUsers] =
    useState([]);
  const [status, setStatus] =
    useState('Connecting...');
  const [shareOpen, setShareOpen] =
    useState(false);
  const [editorInstance, setEditorInstance] =
  useState(null);
  const [saveStatus, setSaveStatus] =
  useState('Saved');

  // API instance
  const api = axios.create({
    baseURL:
      process.env.REACT_APP_API_URL,

    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // ─── Socket Connection ───────────────────────

  useEffect(() => {
    if (!token) return;

    const socket = io(
      process.env.REACT_APP_SOCKET_URL,
      {
        auth: {
          token,
        },
      }
    );

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-document', {
        docId,
      });

      setStatus('Connected');
    });

    // Load document metadata
    socket.on(
      'load-document',
      (data) => {
        setTitle(
          data.title ||
            'Untitled document'
        );
      }
    );

    // Active collaborators
    socket.on('room-users', (users) => {
      // Remove current user
      const filtered = users.filter(
        (u) => u.uid !== user.uid
      );

      setRoomUsers(filtered);
    });

    socket.on(
      'connect_error',
      (err) => {
        console.error(err);

        setStatus(
          'Connection failed'
        );
      }
    );

    // Fetch title initially
    api
      .get(`/documents/${docId}`)
      .then((res) => {
        setTitle(res.data.title);
      })
      .catch(console.error);

    return () => {
      socket.disconnect();
    };
  }, [token, docId]);

  // ─── Save title changes ──────────────────────

  const handleTitleChange = async (
    e
  ) => {
    const newTitle = e.target.value;

    setTitle(newTitle);

    try {
      await api.patch(
        `/documents/${docId}`,
        {
          title: newTitle,
        }
      );

      setStatus('Saved');
    } catch (err) {
      console.error(err);

      setStatus('Save failed');
    }
  };
  useEffect(() => {
    if (!editorInstance) return;

    editorInstance.on(
      'update',
      () => {
        setSaveStatus('Saving...');

        clearTimeout(
          window.saveTimer
        );

        window.saveTimer =
          setTimeout(() => {
            setSaveStatus(
              'Saved'
            );
          }, 800);
      }
    );
  }, [editorInstance]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f1f3f4',
        fontFamily:
          'Inter, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#fff',
          borderBottom:
            '1px solid #e0e0e0',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent:
            'space-between',
          height: 72,
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}
      >
        {/* Left */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
        >
          <span
            onClick={() =>
              navigate('/')
            }
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#1a73e8',
              cursor: 'pointer',
            }}
          >
            CollabDocs
          </span>

          <input
            value={title}
            onChange={
              handleTitleChange
            }
            style={{
              border: 'none',
              outline: 'none',
              fontSize: 18,
              background:
                'transparent',
              color: '#202124',
              minWidth: 240,
              fontWeight: 500,
            }}
          />
        </div>

        {/* Right */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              'flex-end',
            gap: 16,
          }}
        >
          {/* Collaborators */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {roomUsers.map(
              (u, i) => (
                <img
                  key={i}
                  src={
                    u.picture ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      u.name
                    )}`
                  }
                  alt={u.name}
                  title={`${u.name} (${u.email})`}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius:
                      '50%',
                    objectFit:
                      'cover',
                    border:
                      '2px solid white',
                    marginLeft:
                      i === 0
                        ? 0
                        : -10,
                    boxShadow:
                      '0 2px 6px rgba(0,0,0,0.15)',
                  }}
                />
              )
            )}
          </div>

          {/* Status */}
          <span
            style={{
              fontSize: 13,
              color: '#777',
            }}
          >
            {status}
          </span>

          {/* Share Dropdown */}
          <div
            style={{
              position: 'relative',
            }}
          >
            <button
              onClick={() =>
                setShareOpen(
                  !shareOpen
                )
              }
              style={{
                padding:
                  '10px 18px',
                background:
                  '#1a73e8',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Share
            </button>

            {shareOpen && (
              <div
                style={{
                  position:
                    'absolute',
                  right: 0,
                  top: 52,
                  width: 240,
                  background:
                    '#fff',
                  borderRadius: 14,
                  boxShadow:
                    '0 10px 30px rgba(0,0,0,0.12)',
                  padding: 12,
                  zIndex: 99999,
                }}
              >
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      window.location
                        .href
                    );

                    setStatus(
                      'Link copied'
                    );

                    setShareOpen(
                      false
                    );

                    setTimeout(
                      () => {
                        setStatus(
                          'Connected'
                        );
                      },
                      2000
                    );
                  }}
                  style={{
                    width: '100%',
                    padding: 12,
                    border: 'none',
                    borderRadius: 10,
                    background:
                      '#f1f3f4',
                    cursor: 'pointer',
                    textAlign:
                      'left',
                    fontSize: 14,
                  }}
                >
                  🔗 Copy document
                  link
                </button>
              </div>
            )}
          </div>
          <span
            style={{
              fontSize: 13,
              color: '#777',
            }}
          >
            {saveStatus}
          </span>

          {/* Current User */}
          <ProfileMenu
            user={user}
          />
        </div>
      </div>
      {/* Toolbar */}
      <EditorToolbar
        editor={editorInstance}
        title={title}
      />

      {/* Editor */}
      <div
        style={{
          maxWidth: 900,
          margin: '40px auto',
          padding: '0 24px',
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: 8,
            minHeight: '80vh',
            boxShadow:
              '0 2px 8px rgba(0,0,0,0.08)',
            // padding: '70px 90px',
            border: '1px solid #e0e0e0',
            backgroundImage:
              'linear-gradient(to bottom, #ffffff, #fcfcfc)',
          }}
        >


          {/* Document Page */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              // padding: '40px 0 80px',
              background: '#f1f3f4',
              minHeight: '100vh',
            }}
          >
            <div
              style={{
                width: '794px',
                minHeight: '1123px',
                background: '#fff',
                boxShadow:
                  '0 1px 8px rgba(0,0,0,0.15)',
                padding:
                  '20px 20px',
                borderRadius: 4,
              }}
            >
              <CollaborativeEditor
                docId={docId}
                onEditorReady={
                  setEditorInstance
                }
              />
            </div>
          </div>
          {/* <div
            style={{
              maxWidth: 900,
              margin: '40px auto',
              padding: '0 24px',
            }}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: 8,
                minHeight: '80vh',
                boxShadow:
                  '0 2px 8px rgba(0,0,0,0.08)',
                padding: '70px 90px',
                border: '1px solid #e0e0e0',
                backgroundImage:
                  'linear-gradient(to bottom, #ffffff, #fcfcfc)',
              }}
            >
              <CollaborativeEditor
                docId={docId}
                user={user}
                onEditorReady={
                  setEditorInstance
                }
              />
            </div>
          </div> */}
          {/* <EditorToolbar
            editor={editorInstance}
          />
          <CollaborativeEditor
            docId={docId}
            user={user}
            onEditorReady={
              setEditorInstance
            }
          /> */}
        </div>
      </div>
    </div>
  );
}