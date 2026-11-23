import Dropdown from '../ui/Dropdown';

const EMOJIS = [
  '📄', '📝', '📚', '📌', '📎', '🗂️', '📊', '📈',
  '🚀', '💡', '🎯', '✨', '🔥', '⚡', '🌈', '🎨',
  '🧠', '💬', '🗓️', '✅', '🏆', '💼', '🛠️', '🧪',
  '🌍', '🎉', '❤️', '⭐', '🍀', '🌙', '☕', '🎵',
];

export default function EmojiPicker({ value, onChange }) {
  return (
    <Dropdown
      align="left"
      width={300}
      trigger={({ toggle, open }) => (
        <button
          type="button"
          className={`doc-emoji ${open ? 'is-open' : ''}`}
          onClick={toggle}
          aria-label="Change document icon"
          data-tip="Change icon"
        >
          {value || '📄'}
        </button>
      )}
    >
      {({ close }) => (
        <>
          <div className="menu-label">Document icon</div>
          <div className="emoji-grid">
            {EMOJIS.map((emoji) => (
              <button
                type="button"
                key={emoji}
                className={emoji === value ? 'is-active' : ''}
                onClick={() => {
                  onChange(emoji);
                  close();
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}
    </Dropdown>
  );
}
