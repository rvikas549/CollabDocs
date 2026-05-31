# 🚀 CollabDocs

### Realtime Collaborative Document Editor powered by MERN + Yjs + Firebase

<p align="center">
  <img src="https://img.shields.io/badge/React-Frontend-blue?logo=react" />
  <img src="https://img.shields.io/badge/Node.js-Backend-green?logo=node.js" />
  <img src="https://img.shields.io/badge/MongoDB_Atlas-Database-darkgreen?logo=mongodb" />
  <img src="https://img.shields.io/badge/Firebase-Authentication-orange?logo=firebase" />
  <img src="https://img.shields.io/badge/Yjs-CRDT-purple" />
</p>


## 🌐 Live Demo

🚀 **Live App:**  
[CollabDocs](https://collab-docs-lilac.vercel.app)

📚 **Documentation:**  
[CollabDocs Documentation](https://docs.google.com/document/d/1HLc6pHqYYwaekbBSOsqqAw9oRvYnXLIN5DgGReZSs0g/edit?tab=t.0)

---

# 📖 Overview

CollabDocs is a Google Docs inspired realtime collaborative editor.

Users can create documents, share links, edit together instantly, import/export documents, and securely access their workspace.

Built with realtime synchronization using Yjs CRDT architecture.

---

# ✨ Features

- 🔐 Google Authentication
- 📄 Create & manage documents
- ✍️ Rich text editor using TipTap
- 👥 Realtime multi-user collaboration
- 🔗 Share document links
- 💾 Automatic document persistence
- 📥 DOCX Import
- 📤 DOCX Export
- ☁️ Cloud deployed architecture

---

# 🛠️ Tech Stack

## Frontend
- React JS
- TipTap Editor
- Yjs Client
- Firebase Auth
- Axios
- Vercel

## Backend API
- Node JS
- Express JS
- Firebase Admin SDK
- MongoDB Atlas
- Render

## Realtime Server
- Yjs
- WebSocket
- MongoDB Persistence
- Render

---

# 🏗️ Architecture

```txt
                 User
                  |
                  ↓
          React Frontend (Vercel)
                  |
        ┌─────────┴──────────┐
        |                    |
        ↓                    ↓

 REST API Server        Yjs WebSocket Server
 Node + Express         Realtime Sync
 Firebase Admin         CRDT Updates
        |                    |
        ↓                    ↓

 Documents DB        Yjs Persistence DB

              MongoDB Atlas
```

---

# 🔐 Authentication Flow

```txt
Google Login
      ↓
Firebase Authentication
      ↓
Firebase JWT Token
      ↓
Backend Verification
      ↓
Protected APIs
```

---

# 🧠 Collaboration Flow

```txt
TipTap Editor
      ↓
Yjs Document
      ↓
WebSocket Provider
      ↓
Yjs Server
      ↓
MongoDB Persistence
      ↓
All Users Sync
```

---

# 📂 Folder Structure

```txt
CollabDocs/

├── Client/
│   ├── src/
│   ├── public/
│   └── package.json

├── Server/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── socket/
│   ├── index.js
│   ├── yjs-server.js
│   └── package.json
```

---

# ⚙️ Environment Variables

## Client `.env`

```env
REACT_APP_API_URL=http://localhost:4000/api

REACT_APP_SOCKET_URL=http://localhost:4000

REACT_APP_YJS_URL=ws://localhost:1234


REACT_APP_FIREBASE_API_KEY=

REACT_APP_FIREBASE_AUTH_DOMAIN=

REACT_APP_FIREBASE_PROJECT_ID=

REACT_APP_FIREBASE_STORAGE_BUCKET=

REACT_APP_FIREBASE_MESSAGING_SENDER_ID=

REACT_APP_FIREBASE_APP_ID=
```

Production:

```env
REACT_APP_API_URL=https://your-api.onrender.com/api

REACT_APP_SOCKET_URL=https://your-api.onrender.com

REACT_APP_YJS_URL=wss://your-yjs-server.onrender.com
```

---

## Server `.env`

```env
PORT=4000

MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database


CLIENT_URL=http://localhost:3000


FIREBASE_PROJECT_ID=

FIREBASE_CLIENT_EMAIL=

FIREBASE_PRIVATE_KEY=
```

---

## Yjs Server ENV

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database

PORT=1234
```

---

# ▶️ Run Locally

Clone repository:

```bash
git clone <repo-url>
```

---

Install frontend:

```bash
cd Client

npm install

npm start
```

---

Run API server:

```bash
cd Server

npm install

npm run dev
```

---

Run Yjs server:

```bash
cd Server

node yjs-server.js
```

---

# 🚀 Deployment

## Frontend

Hosted on:

```txt
Vercel
```

## Backend API

Hosted on:

```txt
Render Web Service
```

## Yjs Server

Hosted on:

```txt
Render Web Service
```

## Database

Hosted on:

```txt
MongoDB Atlas
```

---

# 🔥 Phase 1 Completed

Implemented:

```txt
Authentication        ✅

Document CRUD         ✅

Realtime Editing      ✅

Yjs Persistence       ✅

DOCX Import/Export    ✅

Sharing               ✅

Cloud Deployment      ✅
```

---

# 🌍 Future Improvements

- Live cursor presence
- User avatars while editing
- Comments
- Version history
- Document permissions
- Templates
- AI document assistant
- PDF export
- Custom domain

---

# 🧑‍💻 Built With

- MERN Stack
- Firebase
- TipTap
- Yjs
- WebSocket
- MongoDB Atlas

Learning:
- Realtime systems
- CRDT architecture
- Cloud deployment
- Authentication systems

---

# ⭐ CollabDocs

> Create. Share. Collaborate. Anywhere.

THANK YOU 🩷
