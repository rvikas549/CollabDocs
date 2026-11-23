import mongoose from 'mongoose';

const PersonSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true },
    name: String,
    email: String,
    picture: String,
  },
  { _id: false }
);

const DocumentSchema = new mongoose.Schema(
  {
    // UUID string ids double as Yjs room names.
    _id: { type: String },

    title: {
      type: String,
      default: 'Untitled document',
      trim: true,
      maxlength: 200,
    },

    // Lets realtime clients decide whether a dashboard rename is newer than their copy.
    titleUpdatedAt: { type: Date, default: Date.now },

    icon: { type: String, default: '📄', maxlength: 16 },

    // ProseMirror JSON snapshot (Yjs binary state lives in the YDoc collection).
    content: { type: Object, default: {} },

    // Derived from content on save — powers dashboard cards and search.
    preview: { type: String, default: '' },
    wordCount: { type: Number, default: 0 },

    owner: PersonSchema,

    // Anyone who has opened the share link. Kept as plain uids for fast queries.
    collaborators: { type: [String], default: [], index: true },
    members: { type: [PersonSchema], default: [] },

    starredBy: { type: [String], default: [] },

    lastEditedBy: {
      uid: String,
      name: String,
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

DocumentSchema.index({ 'owner.uid': 1, updatedAt: -1 });

export default mongoose.model('Document', DocumentSchema);
