# 🚀 CollabDocs

### Realtime collaborative editing powered by MERN + Yjs + Firebase + Socket.IO

<p align="center">
  <img src="https://img.shields.io/badge/React-Frontend-blue?logo=react" />
  <img src="https://img.shields.io/badge/Node.js-Backend-green?logo=node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Database-darkgreen?logo=mongodb" />
  <img src="https://img.shields.io/badge/Firebase-Authentication-orange?logo=firebase" />
  <img src="https://img.shields.io/badge/Socket.IO-Realtime-black?logo=socket.io" />
  <img src="https://img.shields.io/badge/Yjs-CRDT-purple" />
</p>

<p align="center">
  <a href="" target="_blank">
    🌐 Live Demo (Coming Soon)
  </a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="https://docs.google.com" target="_blank">
    📄 Documentation Link
  </a>
</p>

<br/>

# 📖 Overview

CollabDocs is a realtime collaborative document editing platform inspired by Google Docs.

Built using:
- MERN Stack
- Firebase Authentication
- Socket.IO
- TipTap Editor
- Yjs CRDT synchronization

Users can:
- Login using Google OAuth or Email/Password
- Create collaborative documents
- Share document links
- Collaborate with multiple users simultaneously
- Sync edits instantly in realtime
- View connected collaborators live
- Work on shared documents together

<br/>

# 🛠️ Tech Stack

## 🎨 Frontend
- ⚛️ React JS
- ✍️ TipTap Editor
- 🔄 Yjs
- 🔌 Socket.IO Client
- 📡 Axios
- 🔐 Firebase Authentication

## ⚙️ Backend
- 🟢 Node JS
- 🚂 Express JS
- 🔌 Socket.IO
- 🔑 Firebase Admin SDK

## 🗄️ Database
- 🍃 MongoDB

## 🔒 Authentication
- 🔥 Firebase OAuth
- 🪪 Firebase-issued JWT Authentication

<br/>

# 🏗️ Architecture

```txt
             ┌─────────────────────┐
             │     Frontend        │
             │      React JS       │
             └─────────┬───────────┘
                       │
             Firebase Authentication
                       │
                 JWT Token
                       │
                       ▼
             ┌─────────────────────┐
             │      Backend        │
             │   Node + Express    │
             └─────────┬───────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
  Socket.IO Server             MongoDB
  Realtime Rooms              Persistence
         │
         ▼
   Yjs Collaboration
         │
         ▼
   Connected Users
```

<br/>

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

<br/>

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

This project uses Yjs (CRDT-based architecture).

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

## 3️⃣ Firebase Authentication

Firebase handles:
- Google OAuth
- Email/Password Login
- JWT Token Generation

This avoids implementing:
- bcrypt hashing
- JWT signing
- refresh tokens
- session invalidation
- auth route complexity

<br/>

# 🔄 Authentication Flow

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

<br/>

# 🧠 Yjs Collaboration Flow

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

<br/>

# 🔒 Secure Socket.IO Authentication

Socket.IO connections are protected using Firebase JWT tokens.

Unauthorized users cannot:
- connect sockets
- join rooms
- access collaborative sessions

This creates a production-style collaborative architecture.

<br/>

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

<br/>

# ⚙️ Environment Variables

## 📦 Client `.env`

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

## 📦 Server `.env`

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

<br/>

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
Never push this file to GitHub.

This file contains:
- Firebase admin credentials
- database access
- backend authentication privileges

<br/>

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

<br/>

# ▶️ Running the Project

## 1️⃣ Frontend

```bash
cd Client

npm install

npm start
```

## 2️⃣ Backend

```bash
cd Server

npm install

npm run dev
```

## 3️⃣ Yjs WebSocket Server

```bash
cd Server

node yjs-server.js
```

<br/>

# ⚔️ Challenges Faced

## Understanding Realtime Systems

Learning:
- WebSockets
- Socket.IO
- Yjs
- CRDT architecture
- collaborative synchronization

was one of the biggest challenges.

## Realtime Collaboration Complexity

Handling:
- simultaneous edits
- synchronization
- merge conflicts
- distributed updates

requires distributed systems thinking.

## Production Authentication

Using Firebase simplified:
- authentication flow
- token handling
- OAuth integration
- security architecture

while maintaining production-grade authentication.

<br/>

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

<br/>

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

<br/>

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

<br/>

# ⭐ Final Thoughts

Building realtime collaborative systems is significantly more complex than traditional CRUD applications.

This project helped explore:
- WebSockets
- Realtime synchronization
- Distributed state management
- Authentication architecture
- Collaborative editing systems

<br/>

# 🚀 CollabDocs

> Realtime collaborative editing powered by MERN + Yjs + Firebase + Socket.IO

<br/>

## Thank You 🩷
