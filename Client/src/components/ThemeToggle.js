import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';

  return (
    <button
      type="button"
      className={`icon-btn theme-toggle ${dark ? 'is-dark' : ''}`}
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      data-tip={dark ? 'Light mode' : 'Dark mode'}
    >
      <Sun className="theme-toggle__sun" />
      <Moon className="theme-toggle__moon" />
    </button>
  );
}
