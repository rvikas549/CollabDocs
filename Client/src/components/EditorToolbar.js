import { useRef } from 'react';
import {
  exportToDocx,
} from '../utils/exportDocx';
import {
  importDocx,
} from '../utils/importDocx';

export default function EditorToolbar({
  editor,
  title,
}) {
  const fileInputRef =
    useRef(null);

  if (!editor) return null;


  const buttonStyle = (
    active = false
  ) => ({
    padding: '8px 16px',
    borderRadius: 8,
    border: active
      ? '1px solid #1a73e8'
      : '1px solid #dadce0',

    background: active
      ? '#e8f0fe'
      : '#fff',

    color: active
      ? '#1a73e8'
      : '#444',

    cursor: 'pointer',

    fontSize: 14,

    fontWeight: 500,

    transition: 'all 0.2s ease',

    boxShadow: active
      ? '0 1px 2px rgba(26,115,232,0.2)'
      : 'none',
  });

  // const buttonStyle = (
  //   active = false
  // ) => ({
  //   padding: '8px 14px',
  //   borderRadius: 8,
  //   border: '1px solid #ddd',
  //   background: active
  //     ? '#e8f0fe'
  //     : '#fff',
  //   color: active
  //     ? '#1a73e8'
  //     : '#333',
  //   cursor: 'pointer',
  //   fontSize: 14,
  //   fontWeight: 500,
  //   transition: '0.2s',
  // });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',

        padding: '14px 32px',

        background: '#ffffff',

        borderBottom:
          '1px solid #e0e0e0',

        position: 'sticky',

        top: 72,

        zIndex: 100,

        boxShadow:
          '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      {/* Bold */}
      <button
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleBold()
            .run()
        }
        style={buttonStyle(
          editor.isActive('bold')
        )}
      >
        Bold
      </button>

      {/* Italic */}
      <button
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleItalic()
            .run()
        }
        style={buttonStyle(
          editor.isActive(
            'italic'
          )
        )}
      >
        Italic
      </button>

      {/* Underline */}
      <button
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleUnderline()
            .run()
        }
        style={buttonStyle(
          editor.isActive(
            'underline'
          )
        )}
      >
        Underline
      </button>

      {/* H1 */}
      <button
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleHeading({
              level: 1,
            })
            .run()
        }
        style={buttonStyle(
          editor.isActive(
            'heading',
            { level: 1 }
          )
        )}
      >
        H1
      </button>

      {/* Bullet */}
      <button
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleBulletList()
            .run()
        }
        style={buttonStyle(
          editor.isActive(
            'bulletList'
          )
        )}
      >
        Bullet
      </button>

      {/* Ordered */}
      <button
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleOrderedList()
            .run()
        }
        style={buttonStyle(
          editor.isActive(
            'orderedList'
          )
        )}
      >
        Ordered
      </button>

      {/* Code */}
      <button
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleCodeBlock()
            .run()
        }
        style={buttonStyle(
          editor.isActive(
            'codeBlock'
          )
        )}
      >
        Code
      </button>

      {/* Undo */}
      <button
        onClick={() =>
          editor
            .chain()
            .focus()
            .undo()
            .run()
        }
        style={buttonStyle()}
      >
        Undo
      </button>

      {/* Redo */}
      <button
        onClick={() =>
          editor
            .chain()
            .focus()
            .redo()
            .run()
        }
        style={buttonStyle()}
      >
        Redo
      </button>

      {/* Right Side */}
      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          gap: 10,
        }}
      >
        {/* Hidden File Input */}
        <input
          type="file"
          accept=".docx"
          ref={fileInputRef}
          style={{
            display: 'none',
          }}
          onChange={(e) => {
            const file =
              e.target.files[0];

            if (file) {
              importDocx(
                file,
                editor
              );
            }
          }}
        />

        {/* Import */}
        <button
          onClick={() =>
            fileInputRef.current.click()
          }

          style={{
            padding: '10px 18px',

            borderRadius: 8,

            border: 'none',

            background: '#34a853',

            color: '#fff',

            fontWeight: 600,

            cursor: 'pointer',

            boxShadow:
              '0 2px 6px rgba(52,168,83,0.3)',
          }}
        >
          📥 Import DOCX
        </button>

        {/* Export */}
        <button
          onClick={() =>
            exportToDocx(
              editor,
              title
            )
          }

          style={{
            padding: '10px 18px',

            borderRadius: 8,

            border: 'none',

            background: '#1a73e8',

            color: '#fff',

            fontWeight: 600,

            cursor: 'pointer',

            boxShadow:
              '0 2px 6px rgba(26,115,232,0.3)',
          }}
        >
          📤 Export DOCX
        </button>
      </div>
    </div>
  );
}