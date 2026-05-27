import Document from '../models/Document.js';
import admin from '../config/firebase.js';

export default function docHandler(io) {
  const rooms = {};

  // Verify Firebase token on every socket connection
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('No token'));

    try {
      const decoded = await admin.auth().verifyIdToken(token);
      socket.user = {
        uid: decoded.uid,
        name: decoded.name,
        picture: decoded.picture,
        email: decoded.email,
      };
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`${socket.user.name} connected`);

    socket.on('join-document', async ({ docId }) => {
      socket.join(docId);
      socket.docId = docId;

      if (!rooms[docId]) rooms[docId] = new Map();
      rooms[docId].set(socket.id, {
        uid: socket.user.uid,
        name: socket.user.name,
        picture: socket.user.picture,
        email: socket.user.email,
      });

      try {
        let doc = await Document.findById(docId);
        if (!doc) return socket.emit('error', 'Document not found');
        // socket.emit('load-document', doc.content);
        socket.emit('load-document', {
          content: doc.content,
          title: doc.title,
        });
      } catch (err) {
        console.error(err);
      }

      // Send updated user list to everyone in room
      io.to(docId).emit('room-users', Array.from(rooms[docId].values()));
    });

    socket.on('send-changes', ({ docId, delta }) => {
      socket.to(docId).emit('receive-changes', delta);
    });

    socket.on('save-document', async ({ docId, content, title }) => {
      try {
        await Document.findByIdAndUpdate(docId, { content, title });
      } catch (err) {
        console.error('Save error:', err);
      }
    });

    socket.on('disconnect', () => {
      const { docId } = socket;
      if (docId && rooms[docId]) {
        rooms[docId].delete(socket.id);
        if (rooms[docId].size === 0) {
          delete rooms[docId];
          console.log(`${socket.user.name} disconnected`);
        } else {
          io.to(docId).emit('room-users', Array.from(rooms[docId].values()));
        }
      }
    });
  });
}