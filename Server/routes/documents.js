import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Document from '../models/Document.js';
import { verifyToken } from '../middleware/auth.js';


const router = express.Router();

// All routes protected — must be logged in
router.use(verifyToken);

// Create new document
router.post('/', async (req, res) => {
  try {
    const id = uuidv4();

    const doc = new Document({
      _id: id,

      owner: {
        uid: req.user.uid,
        name: req.user.name,
        email: req.user.email,
        picture: req.user.picture,
      },

      collaborators: [req.user.uid],
    });

    await doc.save();

    res.json({ id });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
});

// Get document by ID — add user as collaborator if new
router.get('/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Add to collaborators if not already there
    if (!doc.collaborators.includes(req.user.uid)) {
      doc.collaborators.push(req.user.uid);
      await doc.save();
    }

    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save document content
router.patch('/:id', async (req, res) => {
  try {
    const doc = await Document.findByIdAndUpdate(
      req.params.id,
      { content: req.body.content, title: req.body.title },
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all documents owned by current user
router.get('/', async (req, res) => {
  try {
    const docs = await Document.find({ 'owner.uid': req.user.uid })
      .select('_id title updatedAt')
      .sort({ updatedAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


export default router;
