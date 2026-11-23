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
https://collab-docs-lilac.vercel.app

📚 **Documentation:**  
[CollabDocs Documentation](https://docs.google.com/document/d/1HLc6pHqYYwaekbBSOsqqAw9oRvYnXLIN5DgGReZSs0g/edit?tab=t.0)

---

## CI/CD Workflow
For every PR merge an email notification is sent.

# 📖 Overview

CollabDocs is a Google Docs inspired realtime collaborative editor.

Users can create documents (blank or from templates), share links, edit together with live cursors, import/export documents, and securely access their workspace.

Built with realtime synchronization using the Yjs CRDT architecture.

---

# ✨ Features

### Writing
- ✍️ Rich text editor (TipTap) — headings, lists, checklists, quotes, code blocks, dividers
- 🎨 Text colours, multi-colour highlights, links, alignment
- ⚡ **Slash commands** — type `/` to insert any block
- 🫧 **Floating toolbar** on text selection
- ⌨️ Markdown shortcuts (`#`, `-`, `1.`, `[ ]`, `>`, ```` ``` ````, `---`)
- 🧭 **Document outline** with active-section tracking
- 🧘 **Focus mode** for distraction-free writing
- 🔢 Live word count, character count and reading time

### Collaboration
- 👥 Realtime multi-user editing (Yjs CRDT — no conflicts)
- 🖱️ **Live cursors with names** in each collaborator's colour
- 🟢 Presence avatars — click one to **jump to that person's cursor**
- 📝 Title and document icon sync live for everyone
- 🔗 One-click share link + "people with access" list

### Workspace
- 🔐 Google + email/password sign-in (Firebase) — or local dev sign-in, no keys needed
- 🗂️ Dashboard with **templates** (meeting notes, project brief, weekly planner, brainstorm, blog post)
- ⭐ Star, rename, duplicate, delete (owner only), leave shared docs
- 🔎 Filter tabs (all / owned / shared / starred), sort, grid & list views
- ⌘K **command palette** — search docs and run any action
- 🌗 Light / dark / system theme
- 📱 Responsive down to phone size

### Import / export
- 📥 Import **DOCX, Markdown, HTML, TXT** — button or drag & drop onto the page
- 📤 Export **DOCX** (keeps headings, lists, bold/italic, colours, highlights, links), **PDF**, **Markdown**, **HTML**

---

# 🛠️ Tech Stack

## Frontend
- React 19 + React Router 7
- TipTap 2 (ProseMirror) + Yjs client (`y-websocket`, `y-prosemirror`)
- Firebase Auth
- Axios, lucide-react icons, `docx` + `mammoth` for Word files
- Vercel

## Backend API
- Node.js + Express (helmet, rate limiting, CORS allow-list)
- Firebase Admin SDK (or local dev JWTs)
- MongoDB Atlas (Mongoose)
- Render

## Realtime Server
- Yjs + `y-websocket` protocol (sync + awareness for cursors)
- Token-verified WebSocket connections
- Debounced MongoDB persistence, flushed on shutdown
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
 Node + Express         Realtime Sync + Cursors
 Firebase Admin         Token-verified sockets
        |                    |
        ↓                    ↓

 Documents DB        Yjs Persistence DB

              MongoDB Atlas
```

- **Yjs state** (`YDoc` collection) is the source of truth for document content.
- **REST snapshot** (`Document.content`) powers dashboard previews, word counts, search, duplication and template seeding.

---

# 🔐 Authentication Flow

```txt
Google / Email Login            (or local dev login)
      ↓                                ↓
Firebase Authentication         POST /api/auth/dev-login
      ↓                                ↓
Firebase ID token               signed dev JWT
      └──────────────┬─────────────────┘
                     ↓
     Verified by the API *and* the Yjs server
                     ↓
          Protected APIs + realtime sockets
```

Dev login is only enabled when `DEV_AUTH=true` **and** `NODE_ENV` is not `production`.

---

# 🧠 Collaboration Flow

```txt
TipTap Editor
      ↓
Yjs Document  ←→  Awareness (cursors, names, colours)
      ↓
WebSocket Provider (token in URL, refreshed on reconnect)
      ↓
Yjs Server  — waits for MongoDB restore before syncing
      ↓
MongoDB Persistence (debounced, flushed on shutdown)
      ↓
All Users Sync
```

---

# 📂 Folder Structure

```txt
CollabDocs/
├── package.json            # root scripts: run everything with one command
├── Client/
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── editor/     # workspace, toolbar, slash menu, outline, share…
│       │   └── ui/         # logo, avatars, dropdowns, modals
│       ├── config/         # env, api client, firebase
│       ├── context/        # auth, theme, toasts
│       ├── lib/            # api helpers, templates, utils
│       ├── pages/          # Login, Home, Editor, NotFound
│       ├── styles/         # design system + page styles
│       └── utils/          # importers / exporters
└── Server/
    ├── config/             # env, db, firebase
    ├── lib/                # shared auth + content helpers
    ├── middleware/
    ├── models/
    ├── routes/             # /api/auth, /api/documents
    ├── index.js            # REST API
    └── yjs-server.js       # realtime server
```

---

# ⚙️ Environment Variables

Copy the examples and fill in your values:

```bash
cp Client/.env.example Client/.env
cp Server/.env.example Server/.env
```

## Client `.env`

```env
REACT_APP_API_URL=http://localhost:4000/api
REACT_APP_YJS_URL=ws://localhost:1234

# Leave the API key empty to use local dev sign-in instead of Firebase.
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
REACT_APP_YJS_URL=wss://your-yjs-server.onrender.com
```

> `REACT_APP_SOCKET_URL` is no longer used — presence now runs over Yjs awareness.

## Server `.env`

```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/collabdocs   # or your Atlas URI

# Comma-separated list of allowed frontend origins
CLIENT_URL=http://localhost:3000

FIREBASE_PROJECT_ID=        # required for Firebase sign-in
FIREBASE_CLIENT_EMAIL=      # optional service account
FIREBASE_PRIVATE_KEY=       # optional service account

# Local development sign-in (ignored when NODE_ENV=production)
DEV_AUTH=true
DEV_AUTH_SECRET=change-me-to-a-long-random-string

YJS_PORT=1234
```

## Yjs Server ENV (Render)

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
PORT=1234   # Render injects PORT (and RENDER) automatically

# Add your Firebase project id so sockets are authenticated:
FIREBASE_PROJECT_ID=
```

> Only `FIREBASE_PROJECT_ID` is needed to verify sign-in tokens; the service-account values are optional.
> Without it (and without `DEV_AUTH`) the Yjs server logs a warning and accepts unauthenticated sockets, as before.

---

# ▶️ Run Locally

Clone the repository and install everything:

```bash
git clone <repo-url>
cd CollabDocs
npm run install:all
```

Start the API, realtime server and frontend together:

```bash
npm run dev
```

Then open **http://localhost:3000**.

With no Firebase keys, you'll get a **local dev sign-in** — just type a name.
Open the same document in a second browser (or a private window) with another name to see live cursors.

Prefer separate terminals?

```bash
cd Server && npm run dev        # REST API      → http://localhost:4000
cd Server && npm run dev:yjs    # Yjs server    → ws://localhost:1234
cd Client && npm start          # Frontend      → http://localhost:3000
```

Health checks: `GET /api/health` (API) and `GET /health` (Yjs server).

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
Render Web Service  (start command: npm start)
```

## Yjs Server

Hosted on:

```txt
Render Web Service  (start command: npm run start:yjs)
```

## Database

Hosted on:

```txt
MongoDB Atlas
```

---

# 🔥 Phase 1 Completed

```txt
Authentication        ✅
Document CRUD         ✅
Realtime Editing      ✅
Yjs Persistence       ✅
DOCX Import/Export    ✅
Sharing               ✅
Cloud Deployment      ✅
```

# 💜 Phase 2 Completed

```txt
New design system (light + dark)          ✅
Live cursor presence + avatars            ✅
Templates                                 ✅
Slash commands + floating toolbar         ✅
⌘K command palette                        ✅
Outline, focus mode, word count           ✅
PDF / Markdown / HTML export              ✅
Markdown / HTML / TXT import + drag&drop  ✅
Star, rename, duplicate, leave            ✅
Owner-only delete + authenticated sockets ✅
Reliable Yjs persistence                  ✅
Local dev sign-in                         ✅
```

---

# 🌍 Future Improvements

- Comments & suggestions
- Version history
- Granular permissions (viewer / commenter / editor)
- AI document assistant
- Offline persistence (IndexedDB)
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
