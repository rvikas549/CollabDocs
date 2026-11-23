import mongoose from 'mongoose';

const YDocSchema = new mongoose.Schema(
  {
    docName: { type: String, required: true, unique: true },
    // Full Yjs state as a single merged update.
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('YDoc', YDocSchema);
