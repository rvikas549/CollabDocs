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
- Login using Google OAuth
- Create collaborative documents
- Share document links
- Collaborate in realtime
- Sync edits instantly
- View connected collaborators live

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
