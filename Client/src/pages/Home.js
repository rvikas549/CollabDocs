import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import axios from 'axios';
import ProfileMenu from '../components/ProfileMenu';

export default function Home() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: { Authorization: `Bearer ${token}` },
  });

  useEffect(() => {
    fetchDocs();
  }, [token]);

  const fetchDocs = async () => {
    try {
      const res = await api.get('/documents');
      setDocs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const createDocument = async () => {
    setLoading(true);
    try {
      const res = await api.post('/documents');
      navigate(`/doc/${res.data.id}`);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // const handleSignOut = () => signOut(auth);
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8f9fa',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #e0e0e0',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 70,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Left */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: '#1a73e8',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            C
          </div>

          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 22,
                color: '#202124',
              }}
            >
              CollabDocs
            </h1>

            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: '#777',
              }}
            >
              Real-time collaboration
            </p>
          </div>
        </div>

        {/* Right */}
        <ProfileMenu user={user} />
        {/* <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: '#f1f3f4',
              padding: '6px 12px',
              borderRadius: 999,
            }}
          >
            <img
              src={
                user.photoURL ||
                'https://ui-avatars.com/api/?name=' +
                encodeURIComponent(user.displayName || 'User')
              }
              alt="avatar"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />

            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#202124',
                }}
              >
                {user.displayName}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: '#666',
                }}
              >
                {user.email}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#e53935',
              color: '#fff',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div> */}
      </div>

      {/* Main Content */}
      <div
        style={{
          maxWidth: 1000,
          margin: '0 auto',
          padding: '40px 24px',
        }}
      >
        {/* Create Document */}
        <div
          style={{
            marginBottom: 40,
          }}
        >
          <p
            style={{
              color: '#666',
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            Start a new document
          </p>

          <button
            onClick={createDocument}
            disabled={loading}
            style={{
              width: 140,
              height: 180,
              border: '1px solid #ddd',
              borderRadius: 10,
              background: '#fff',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            <span
              style={{
                fontSize: 42,
                color: '#1a73e8',
              }}
            >
              +
            </span>

            <span
              style={{
                fontSize: 14,
                color: '#444',
              }}
            >
              {loading
                ? 'Creating...'
                : 'Blank Document'}
            </span>
          </button>
        </div>
        <input
          placeholder="Search documents..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          style={{
            width: '100%',
            padding: 14,
            borderRadius: 10,
            border: '1px solid #ddd',
            marginBottom: 24,
          }}
        />

        {/* Recent Documents */}
        <div>
          <p
            style={{
              color: '#666',
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            Recent documents
          </p>

          {docs.length === 0 ? (
            <div
              style={{
                color: '#999',
                fontSize: 14,
              }}
            >
              No documents yet
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 20,
              }}
              >
                {/* <input
                  placeholder="Search documents..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  style={{
                    width: '100%',
                    padding: 14,
                    borderRadius: 10,
                    border: '1px solid #ddd',
                    marginBottom: 24,
                  }}
                /> */}
                {docs
                  .filter((doc) =>
                    doc.title
                      ?.toLowerCase()
                      .includes(
                        search.toLowerCase()
                      )
                  )
                  .map((doc) => (
                <div
                  key={doc._id}
                  onClick={() =>
                    navigate(`/doc/${doc._id}`)
                  }
                  style={{
                    background: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: 10,
                    padding: 18,
                    cursor: 'pointer',
                    transition: '0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      'none';
                  }}
                >
                  <div
                    style={{
                      fontSize: 38,
                      marginBottom: 10,
                    }}
                  >
                    📄
                  </div>

                  {/* <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: '#202124',
                      marginBottom: 6,
                    }}
                  >
                    {doc.title}
                  </div> */}

                  <div
                    style={{
                      fontSize: 12,
                      color: '#777',
                    }}
                  >
                    {new Date(
                      doc.updatedAt
                    ).toLocaleDateString()}
                  </div>
                  <div
                    key={doc._id}
                  >
                    <h3>{doc.title}</h3>

                    <button
                      onClick={async (e) => {
                        e.stopPropagation();

                        await api.delete(
                          `/documents/${doc._id}`
                        );

                        fetchDocs();
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // return (
  //   <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: 'sans-serif' }}>
  //     {/* Header */}
  //     <div style={{
  //       background: '#fff', borderBottom: '1px solid #e0e0e0',
  //       padding: '0 24px', display: 'flex', alignItems: 'center',
  //       justifyContent: 'space-between', height: 64
  //     }}>
  //       <h1 style={{ fontSize: 22, color: '#1a73e8', margin: 0 }}>CollabDocs</h1>
  //       <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
  //         <span style={{ fontSize: 14, color: '#555' }}>{user.displayName}</span>
  //         <button
  //           onClick={handleLogout}
  //           style={{
  //             padding: '8px 16px',
  //             cursor: 'pointer',
  //             borderRadius: 8,
  //             border: 'none',
  //             background: '#e53935',
  //             color: '#fff',
  //           }}
  //         >
  //           Logout
  //         </button>
  //         {/* <img
  //           src={user.photoURL} alt="avatar"
  //           style={{ width: 36, height: 36, borderRadius: '50%', cursor: 'pointer' }}
  //           onClick={handleSignOut}
  //           title="Click to sign out"
  //         /> */}
  //       </div>
  //     </div>

  //     {/* New doc button */}
  //     <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
  //       <div style={{ marginBottom: 32 }}>
  //         <p style={{ color: '#666', fontSize: 14, marginBottom: 12 }}>Start a new document</p>
  //         <button
  //           onClick={createDocument}
  //           disabled={loading}
  //           style={{
  //             width: 120, height: 156, border: '1px solid #e0e0e0',
  //             borderRadius: 8, background: '#fff', cursor: 'pointer',
  //             display: 'flex', flexDirection: 'column', alignItems: 'center',
  //             justifyContent: 'center', gap: 8, fontSize: 13, color: '#555'
  //           }}
  //         >
  //           <span style={{ fontSize: 36 }}>+</span>
  //           {loading ? 'Creating...' : 'Blank document'}
  //         </button>
  //       </div>

  //       {/* Recent docs */}
  //       {docs.length > 0 && (
  //         <div>
  //           <p style={{ color: '#666', fontSize: 14, marginBottom: 12 }}>Recent documents</p>
  //           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
  //             {docs.map((doc) => (
  //               <div
  //                 key={doc._id}
  //                 onClick={() => navigate(`/doc/${doc._id}`)}
  //                 style={{
  //                   background: '#fff', border: '1px solid #e0e0e0',
  //                   borderRadius: 8, padding: 16, cursor: 'pointer',
  //                   transition: 'box-shadow 0.2s'
  //                 }}
  //                 onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'}
  //                 onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
  //               >
  //                 <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
  //                 <div style={{ fontSize: 14, fontWeight: 500, color: '#333', marginBottom: 4 }}>
  //                   {doc.title}
  //                 </div>
  //                 <div style={{ fontSize: 11, color: '#999' }}>
  //                   {new Date(doc.updatedAt).toLocaleDateString()}
  //                 </div>
  //               </div>
  //             ))}
  //           </div>
  //         </div>
  //       )}
  //     </div>
  //   </div>
  // );
}