import crypto from 'crypto';
import express from 'express';
import Document from '../models/Document.js';
import YDoc from '../models/YDoc.js';
import { verifyToken } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errors.js';
import { summarise, isProseMirrorDoc } from '../lib/content.js';

const router = express.Router();

const DOC_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const LIST_FIELDS =
  '_id title titleUpdatedAt icon preview wordCount owner members collaborators starredBy lastEditedBy createdAt updatedAt';

router.use(verifyToken);

router.param('id', (req, res, next, id) => {
  if (!DOC_ID_RE.test(id)) return next(new HttpError(400, 'Invalid document id'));
  next();
});

// ─── helpers ────────────────────────────────────────────

const person = (user) => ({
  uid: user.uid,
  name: user.name,
  email: user.email,
  picture: user.picture,
});

const cleanTitle = (value) => {
  if (typeof value !== 'string') return undefined;
  const title = value.replace(/\s+/g, ' ').trim().slice(0, 200);
  return title || 'Untitled document';
};

const cleanIcon = (value) =>
  typeof value === 'string' && value.trim() ? [...value.trim()].slice(0, 4).join('') : undefined;

/** Shapes a document for the client, hiding other users' private star lists. */
function present(doc, uid, { includeContent = false } = {}) {
  const plain = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const { starredBy = [], collaborators = [], content, ...rest } = plain;

  return {
    ...rest,
    ...(includeContent ? { content } : {}),
    id: plain._id,
    starred: starredBy.includes(uid),
    isOwner: plain.owner?.uid === uid,
    collaboratorCount: collaborators.length,
  };
}

async function findAccessible(id, uid) {
  const doc = await Document.findOne({ _id: id, collaborators: uid });
  if (doc) return doc;

  const exists = await Document.exists({ _id: id });
  throw new HttpError(exists ? 403 : 404, exists ? 'You do not have access to this document' : 'Document not found');
}

// ─── list ───────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { uid } = req.user;
    const scope = String(req.query.scope || 'all');

    const filters = {
      all: { $or: [{ 'owner.uid': uid }, { collaborators: uid }] },
      owned: { 'owner.uid': uid },
      shared: { collaborators: uid, 'owner.uid': { $ne: uid } },
      starred: { starredBy: uid, collaborators: uid },
    };

    const docs = await Document.find(filters[scope] || filters.all)
      .select(LIST_FIELDS)
      .sort({ updatedAt: -1 })
      .limit(500)
      .lean();

    res.json(docs.map((doc) => present(doc, uid)));
  })
);

// ─── create ─────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { title, icon, content } = req.body || {};
    const me = person(req.user);
    const initialContent = isProseMirrorDoc(content) ? content : {};

    const doc = await Document.create({
      _id: crypto.randomUUID(),
      title: cleanTitle(title) || 'Untitled document',
      icon: cleanIcon(icon) || '📄',
      content: initialContent,
      ...summarise(initialContent),
      owner: me,
      collaborators: [me.uid],
      members: [me],
      lastEditedBy: { uid: me.uid, name: me.name },
    });

    // `id` kept at top level for backwards compatibility with older clients.
    res.status(201).json(present(doc, me.uid, { includeContent: true }));
  })
);

// ─── read (joining via share link) ──────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const me = person(req.user);

    // Opening a shared link grants edit access. Visits must not bump updatedAt.
    // 1) Known member: refresh their profile (name / avatar may have changed).
    const refreshed = await Document.updateOne(
      { _id: req.params.id, 'members.uid': me.uid },
      { $set: { 'members.$': me }, $addToSet: { collaborators: me.uid } },
      { timestamps: false }
    );

    // 2) New visitor (or a legacy doc without a members list): add them.
    if (!refreshed.matchedCount) {
      await Document.updateOne(
        { _id: req.params.id, 'members.uid': { $ne: me.uid } },
        { $push: { members: me }, $addToSet: { collaborators: me.uid } },
        { timestamps: false }
      );
    }

    const doc = await Document.findById(req.params.id).lean();
    if (!doc) throw new HttpError(404, 'Document not found');

    res.json(present(doc, me.uid, { includeContent: true }));
  })
);

// ─── update (autosave + rename + icon) ──────────────────

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { title, icon, content } = req.body || {};
    const update = {};

    const nextTitle = cleanTitle(title);
    if (nextTitle !== undefined) {
      update.title = nextTitle;
      update.titleUpdatedAt = new Date();
    }

    const nextIcon = cleanIcon(icon);
    if (nextIcon !== undefined) update.icon = nextIcon;

    if (content !== undefined) {
      if (!isProseMirrorDoc(content)) throw new HttpError(400, 'Content must be a ProseMirror document');
      Object.assign(update, { content }, summarise(content));
    }

    if (!Object.keys(update).length) throw new HttpError(400, 'Nothing to update');

    update.lastEditedBy = { uid: req.user.uid, name: req.user.name };

    const doc = await Document.findOneAndUpdate(
      { _id: req.params.id, collaborators: req.user.uid },
      { $set: update },
      { new: true }
    )
      .select(LIST_FIELDS)
      .lean();

    if (!doc) {
      await findAccessible(req.params.id, req.user.uid);
      throw new HttpError(409, 'Document changed while saving — please retry');
    }

    res.json(present(doc, req.user.uid));
  })
);

// ─── star / unstar ──────────────────────────────────────

router.post(
  '/:id/star',
  asyncHandler(async (req, res) => {
    const starred = req.body?.starred !== false;
    const op = starred ? { $addToSet: { starredBy: req.user.uid } } : { $pull: { starredBy: req.user.uid } };

    const result = await Document.updateOne({ _id: req.params.id, collaborators: req.user.uid }, op, {
      timestamps: false,
    });
    if (!result.matchedCount) await findAccessible(req.params.id, req.user.uid);

    res.json({ starred });
  })
);

// ─── duplicate ──────────────────────────────────────────

router.post(
  '/:id/duplicate',
  asyncHandler(async (req, res) => {
    const source = await findAccessible(req.params.id, req.user.uid);
    const me = person(req.user);
    const id = crypto.randomUUID();

    const copy = await Document.create({
      _id: id,
      title: `Copy of ${source.title}`.slice(0, 200),
      icon: source.icon,
      content: source.content,
      preview: source.preview,
      wordCount: source.wordCount,
      owner: me,
      collaborators: [me.uid],
      members: [me],
      lastEditedBy: { uid: me.uid, name: me.name },
    });

    // Copy the realtime state too, so the duplicate opens with identical rich content.
    const ystate = await YDoc.findOne({ docName: source._id });
    if (ystate) await YDoc.create({ docName: id, data: ystate.data });

    res.status(201).json(present(copy, me.uid));
  })
);

// ─── leave a shared document ────────────────────────────

router.post(
  '/:id/leave',
  asyncHandler(async (req, res) => {
    const { uid } = req.user;
    const result = await Document.updateOne(
      { _id: req.params.id, 'owner.uid': { $ne: uid }, collaborators: uid },
      { $pull: { collaborators: uid, members: { uid }, starredBy: uid } },
      { timestamps: false }
    );

    if (!result.matchedCount) {
      throw new HttpError(400, 'You can only leave documents that are shared with you');
    }

    res.json({ success: true });
  })
);

// ─── delete (owner only) ────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await Document.deleteOne({ _id: req.params.id, 'owner.uid': req.user.uid });

    if (!result.deletedCount) {
      const exists = await Document.exists({ _id: req.params.id });
      throw new HttpError(
        exists ? 403 : 404,
        exists ? 'Only the owner can delete this document' : 'Document not found'
      );
    }

    await YDoc.deleteOne({ docName: req.params.id });
    res.json({ success: true });
  })
);

export default router;
