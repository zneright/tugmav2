import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-950
        ${isDark ? 'bg-zinc-800 border border-zinc-700' : 'bg-zinc-200 border border-zinc-300'}
      `}
      aria-label="Toggle Dark Mode"
    >
      <span
        className={`
          inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out flex items-center justify-center
          ${isDark ? 'translate-x-[26px] bg-zinc-900' : 'translate-x-1 bg-white'}
        `}
      >
        {isDark ? (
          <Moon size={14} className="text-purple-400" />
        ) : (
          <Sun size={14} className="text-amber-500" />
        )}
      </span>
    </button>
  );
}