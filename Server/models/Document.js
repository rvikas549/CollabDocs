import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
    },

    title: {
      type: String,
      default: 'Untitled Document',
    },

    content: {
      type: Object,
      default: {},
    },

    owner: {
      uid: String,
      name: String,
      email: String,
      picture: String,
    },

    collaborators: [String],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  'Document',
  DocumentSchema
);