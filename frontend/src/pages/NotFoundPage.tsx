import React from 'react';
import { Link } from 'react-router-dom';
import { Link2, ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { ThemeToggle } from '../components/ThemeToggle';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 p-6 transition-colors duration-200">
      <div className="flex justify-between items-center max-w-7xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center text-white">
            <Link2 className="w-4 h-4 -rotate-45" />
          </div>
          <span>CtrlLink</span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="text-center space-y-4 max-w-md mx-auto">
        <div className="text-6xl font-black bg-linear-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent">
          404
        </div>
        <h1 className="text-2xl font-bold">Page Not Found</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          The link or page you are trying to visit does not exist or has expired.
        </p>
        <div className="pt-2">
          <Link to="/">
            <Button leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Return to Links
            </Button>
          </Link>
        </div>
      </div>

      <div className="text-center text-xs text-zinc-500">
        &copy; {new Date().getFullYear()} CtrlLink
      </div>
    </div>
  );
};
