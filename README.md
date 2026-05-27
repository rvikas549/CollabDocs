 🚀 CollabDocs - MERN Stack Collaborative Editor
Realtime collaborative editing powered by MERN + Yjs + Firebase + Socket.IO

<p>
  <a href="" target="_blank">
    🔗 Live Url : Coming Soonn..
  </a>
</p>

<p>
  <a href="https://docs.google.com" target="_blank">
    📄 Documentation Link
  </a>
</p>



# 🛠️ Tech Stack

## Frontend
- React JS
- TipTap Editor
- Yjs
- Socket.IO Client
- Axios
- Firebase Authentication

## Backend
- Node JS
- Express JS
- Socket.IO
- Firebase Admin SDK

## Database
- MongoDB

## Authentication
- Firebase OAuth
- Firebase-issued JWT Authentication

---

# 📖 Overview

CollabDocs is a **Realtime Collaborative Document Editing Platform** inspired by Google Docs.

Built using the **MERN Stack**, Firebase Authentication, Socket.IO, TipTap Editor, and Yjs CRDT synchronization.

Users can:
- Login using Google OAuth or Email/Password
- Create collaborative documents
- Share document links
- Edit documents in realtime
- Collaborate with multiple users simultaneously
- View connected collaborators live
- Sync changes instantly using CRDT architecture

---

# 🔥 Key Concepts Used

## 1️⃣ Rooms (Realtime Collaboration)

Each document acts as a shared room.

```txt
Shared Link → Join Room → Collaborate Realtime
```

Using Socket.IO rooms:
- Multiple users can join the same document
- Changes are broadcasted instantly
- Presence tracking becomes possible



## 2️⃣ CRDT / Realtime Synchronization

This project uses **Yjs (CRDT-based architecture)**.

### Why Yjs?

Traditional collaboration systems use:
- OT (Operational Transformation)

Modern systems prefer:
- CRDT (Conflict-free Replicated Data Types)

Yjs provides:
- Conflict-free editing
- Distributed synchronization
- Realtime state merging
- Peer synchronization

---

# ⚡ Integrations

```txt
Frontend  ↔  Backend  ↔  Database
    │            │
 Socket.IO    Firebase
       │
Realtime Collaboration
       │
Firebase JWT Authentication
```

---

# 🔐 Authentication Flow

Firebase handles:
- Google OAuth
- Email/Password Login
- JWT Generation

This avoids implementing:
- bcrypt hashing
- JWT signing
- refresh tokens
- session invalidation
- auth route complexity

---

# 🔄 Auth Flow

```txt
Frontend Login
      ↓
Firebase Authentication
      ↓
Firebase returns JWT token
      ↓
Frontend sends token to backend
      ↓
Backend verifies token
      ↓
Protected API access
```

---

# 🧠 Yjs Architecture

```txt
TipTap Editor
     ↓
Yjs Document
     ↓
WebSocket Provider
     ↓
Realtime Sync
     ↓
All Connected Users
```

---

# ✨ Exploring Modern Libraries

## 🟣 Yjs

> A CRDT framework with shared data structures.

Yjs automatically:
- syncs changes
- merges updates
- resolves conflicts
- distributes operations

without manual merge handling.

---

## ✍️ TipTap Editor

TipTap is a modern rich-text editor built on top of ProseMirror.

Features:
- Rich text editing
- Realtime collaboration
- Extensible architecture
- Production-grade editor framework

---


# 🏗️ Backend Architecture

## Production-style Features

✅ Authenticated APIs  
✅ Room-based collaboration  
✅ Realtime synchronization  
✅ Secure Socket.IO connections  
✅ Protected routes  
✅ Firebase token verification  
✅ Collaborative editing architecture  

---

# 🔒 Socket.IO Authentication

Socket.IO connections are protected using Firebase JWT tokens.

Unauthorized users cannot:
- connect sockets
- join rooms
- access collaborative sessions

---

# ⚔️ Challenges Faced

## 1️⃣ Understanding Realtime Systems

Learning:
- WebSockets
- Socket.IO
- Yjs
- CRDT architecture
- collaborative synchronization

was one of the biggest challenges.

---

## 2️⃣ Realtime Collaboration Complexity

Handling:
- simultaneous edits
- synchronization
- merge conflicts
- distributed updates

requires understanding distributed systems concepts.

---

## 3️⃣ Production Authentication

Using Firebase simplified:
- authentication flow
- token handling
- OAuth integration
- security architecture

while maintaining production-grade security.

---

# 📂 Folder Structure

```txt
CollabDocs/
│
├── Client/
│   ├── src/
│   ├── public/
│   ├── .env
│   └── package.json
│
├── Server/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── sockets/
│   ├── config/
│   ├── .env
│   ├── yjs-server.js
│   └── package.json
```

---

# ⚙️ Environment Variables

# 📦 Client `.env`

Create:

```txt
Client/.env
```

Add:

```env
REACT_APP_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY

REACT_APP_FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_AUTH_DOMAIN

REACT_APP_FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID

REACT_APP_FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET

REACT_APP_FIREBASE_MESSAGING_SENDER_ID=YOUR_FIREBASE_MESSAGING_SENDER_ID

REACT_APP_FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID

REACT_APP_API_URL=http://localhost:4000/api

REACT_APP_SOCKET_URL=http://localhost:4000

REACT_APP_YJS_URL=ws://localhost:1234
```

---

# 📦 Server `.env`

Create:

```txt
Server/.env
```

Add:

```env
PORT=4000

MONGO_URI=mongodb://localhost:27017/collabdocs

CLIENT_URL=http://localhost:3000
```

---

# 🔑 Firebase Admin SDK

Download Firebase Admin SDK JSON file:

```txt
serviceAccountKey.json
```

Place it inside:

```txt
Server/config/
```

⚠️ IMPORTANT:
NEVER push this file to GitHub.

This file contains:
- admin credentials
- database access
- Firebase admin privileges

---

# 🚫 `.gitignore`

Create/update:

```txt
.gitignore
```

Add:

```gitignore
node_modules

.env

serviceAccountKey.json
```

---

# ▶️ Running the Project

## 1️⃣ Frontend

```bash
cd Client

npm install

npm start
```

---

## 2️⃣ Backend

```bash
cd Server

npm install

npm run dev
```

---

## 3️⃣ Yjs WebSocket Server

```bash
cd Server

node yjs-server.js
```

---

# 🌍 Future Improvements

- DOCX Export
- DOCX Import
- Drag & Drop Uploads
- Rich Text Toolbar
- Collaborative Cursor Presence
- Persistent Yjs State
- Deployment
- Role-based permissions
- Cloud Storage

---

# 🧑‍💻 Author

Built with:
- MERN Stack
- Firebase
- Socket.IO
- Yjs
- TipTap

while learning:
- distributed systems
- realtime synchronization
- CRDT architecture
- collaborative software engineering

---

# ⭐ Final Thoughts

Building realtime collaborative systems is significantly more complex than traditional CRUD applications.

This project helped explore:
- WebSockets
- Realtime synchronization
- Distributed state management
- Authentication architecture
- Collaborative editing systems

---

# 📌 Realtime Collaboration Demo

```txt
User A types
      ↓
Yjs Sync
      ↓
Socket Transport
      ↓
User B instantly receives updates
```

No refreshes.  
No merge conflicts.  
Realtime collaboration.

---

Thank You!!
