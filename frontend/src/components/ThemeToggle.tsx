import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {showLabel && (
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 select-none">
          <Sun className="w-3.5 h-3.5 text-slate-400" />
          Theme
        </span>
      )}
      <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            resolvedTheme === 'light'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
          aria-label="Light mode"
          title="Switch to Light mode"
        >
          <Sun className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
            resolvedTheme === 'dark'
              ? 'bg-slate-900 text-blue-400 shadow-xs'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
          aria-label="Dark mode"
          title="Switch to Dark mode"
        >
          <Moon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
