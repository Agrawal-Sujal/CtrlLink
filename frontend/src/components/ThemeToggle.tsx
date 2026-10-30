import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all duration-200 cursor-pointer
        bg-zinc-100 hover:bg-zinc-200 text-zinc-700
        dark:bg-zinc-900/90 dark:hover:bg-zinc-800 dark:text-zinc-200 dark:hover:text-white
        border border-zinc-200 dark:border-white/[0.08] shadow-xs
        focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 active:scale-95 ${className}`}
      title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode`}
      aria-label="Toggle theme"
    >
      <div className="relative w-4.5 h-4.5 flex items-center justify-center">
        {resolvedTheme === 'dark' ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-200 hover:-rotate-12" />
        )}
      </div>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};
