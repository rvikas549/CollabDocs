import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useMemo, useEffect } from 'react';
import './CollaborativeEditor.css';

export default function CollaborativeEditor({
  docId,
}) {
  // Shared document
  const ydoc = useMemo(() => {
    return new Y.Doc();
  }, []);

  // Websocket provider
  const provider = useMemo(() => {
    return new WebsocketProvider(
      'ws://localhost:1234',
      docId,
      ydoc
    );
  }, [docId, ydoc]);

  // TipTap editor
  const editor = useEditor({
    immediatelyRender: false,

    extensions: [
      StarterKit.configure({
        history: false,
      }),

      Collaboration.configure({
        document: ydoc,
      }),
    ],

    editorProps: {
      attributes: {
        class:
          'tiptap-editor',
      },
    },
  });

  // Cleanup
  useEffect(() => {
    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [provider, ydoc]);

  if (!editor) {
    return (
      <div style={{ padding: 20 }}>
        Loading editor...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: 500,
      }}
    >
      <EditorContent editor={editor} />
    </div>
  );
}