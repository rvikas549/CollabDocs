import {
  useEditor,
  EditorContent,
} from '@tiptap/react';

import StarterKit from '@tiptap/starter-kit';

import Collaboration from '@tiptap/extension-collaboration';

import Underline from '@tiptap/extension-underline';

import TextAlign from '@tiptap/extension-text-align';

import * as Y from 'yjs';

import { WebsocketProvider } from 'y-websocket';

import {
  useMemo,
  useEffect,
} from 'react';

import './CollaborativeEditor.css';

export default function CollaborativeEditor({
  docId,
  onEditorReady,
}) {
  // Shared Yjs document
  const ydoc = useMemo(() => {
    return new Y.Doc();
  }, []);
console.log(
  'YJS URL:',
  process.env.REACT_APP_YJS_URL
);
  // WebSocket provider
  const provider = useMemo(() => {
    return new WebsocketProvider(
      process.env
        .REACT_APP_YJS_URL ||
        'ws://localhost:1234',
      docId,
      ydoc
    );
  }, [docId, ydoc]);
  provider.on('status', (event) => {
  console.log(
    'YJS STATUS:',
    event.status
  );
});

  // TipTap editor
  const editor = useEditor({
    immediatelyRender: false,

    extensions: [
      StarterKit.configure({
        history: false,
      }),

      Underline,

      TextAlign.configure({
        types: [
          'heading',
          'paragraph',
        ],
      }),

      Collaboration.configure({
        document: ydoc,
      }),
    ],

    editorProps: {
      handleKeyDown(
        view,
        event
      ) {
        // CMD + S
        if (
          event.metaKey &&
          event.key === 's'
        ) {
          event.preventDefault();

          console.log(
            'Document saved'
          );
        }
      },

      attributes: {
        class:
          'tiptap-editor',
      },
    },
  });

  useEffect(() => {
    if (
      editor &&
      window.loadedContent &&
      Object.keys(
        window.loadedContent
      ).length
    ) {
      editor.commands.setContent(
        window.loadedContent
      );
    }
  }, [editor]);

  // Send editor instance up
  useEffect(() => {
    if (
      editor &&
      onEditorReady
    ) {
      onEditorReady(editor);
    }
  }, [editor]);

  // Cleanup
  useEffect(() => {
    return () => {
      provider.destroy();

      ydoc.destroy();
    };
  }, [provider, ydoc]);

  if (!editor) {
    return (
      <div
        style={{
          padding: 20,
        }}
      >
        Loading editor...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: 500,
      }}
      onDragOver={(e) =>
        e.preventDefault()
      }
      onDrop={async (e) => {
        e.preventDefault();

        const file =
          e.dataTransfer.files[0];

        if (
          file &&
          file.name.endsWith(
            '.docx'
          )
        ) {
          const {
            importDocx,
          } = await import(
            '../utils/importDocx'
          );

          importDocx(
            file,
            editor
          );
        }
      }}
    >
      <EditorContent
        editor={editor}
      />
    </div>
  );
}