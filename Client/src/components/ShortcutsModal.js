import { Keyboard } from 'lucide-react';
import { Modal, ModalHeader } from './ui/Modal';
import { modKey } from '../lib/utils';

const GROUPS = [
  {
    title: 'General',
    items: [
      [[modKey, 'K'], 'Search documents and commands'],
      [[modKey, '/'], 'Show keyboard shortcuts'],
      [[modKey, 'S'], 'Save'],
      [[modKey, 'P'], 'Export as PDF'],
    ],
  },
  {
    title: 'Editor',
    items: [
      [['/'], 'Insert block (slash menu)'],
      [[modKey, '\\'], 'Toggle outline'],
      [[modKey, '⇧', 'F'], 'Focus mode'],
      [[modKey, 'K'], 'Add link (with text selected)'],
      [[modKey, 'Z'], 'Undo'],
      [[modKey, '⇧', 'Z'], 'Redo'],
    ],
  },
  {
    title: 'Formatting',
    items: [
      [[modKey, 'B'], 'Bold'],
      [[modKey, 'I'], 'Italic'],
      [[modKey, 'U'], 'Underline'],
      [[modKey, '⇧', 'H'], 'Highlight'],
      [[modKey, '⌥', '1'], 'Heading 1'],
      [[modKey, '⇧', '8'], 'Bulleted list'],
      [[modKey, '⇧', '9'], 'Checklist'],
    ],
  },
  {
    title: 'Markdown shortcuts',
    items: [
      [['#', 'space'], 'Heading'],
      [['-', 'space'], 'Bulleted list'],
      [['1.', 'space'], 'Numbered list'],
      [['[ ]', 'space'], 'Checklist'],
      [['>', 'space'], 'Quote'],
      [['```'], 'Code block'],
      [['---'], 'Divider'],
    ],
  },
];

export default function ShortcutsModal({ onClose }) {
  return (
    <Modal onClose={onClose} size="lg" label="Keyboard shortcuts">
      <ModalHeader icon={Keyboard} title="Keyboard shortcuts" onClose={onClose} />
      <div className="modal-body shortcuts">
        {GROUPS.map((group) => (
          <div key={group.title} className="shortcuts-group">
            <h4>{group.title}</h4>
            {group.items.map(([keys, label]) => (
              <div key={label} className="shortcut-row">
                <span>{label}</span>
                <span className="shortcut-keys">
                  {keys.map((k) => (
                    <kbd key={k}>{k}</kbd>
                  ))}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Modal>
  );
}
