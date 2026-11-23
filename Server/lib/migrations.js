import Document from '../models/Document.js';
import { summarise } from './content.js';

/**
 * Documents created before v2 have content but no preview / word count / members.
 * Fill those in once so the dashboard shows real previews and avatars.
 */
export async function backfillLegacyDocuments() {
  const legacy = await Document.find(
    { $or: [{ preview: { $exists: false } }, { members: { $exists: false } }] },
    { content: 1, owner: 1, preview: 1, members: 1 }
  ).lean();

  if (!legacy.length) return 0;

  await Document.bulkWrite(
    legacy.map((doc) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $set: {
            ...(doc.preview === undefined ? summarise(doc.content || {}) : {}),
            ...(doc.members === undefined && doc.owner?.uid ? { members: [doc.owner] } : {}),
          },
        },
        timestamps: false,
      },
    }))
  );

  return legacy.length;
}
