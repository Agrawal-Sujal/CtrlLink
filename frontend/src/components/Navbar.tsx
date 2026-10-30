import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Link2, LogOut, User as UserIcon } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isProfileActive = location.pathname === '/profile';
  const isHomeActive = location.pathname === '/' || location.pathname === '/urls';

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 dark:bg-[#09090b]/85 border-b border-zinc-200/80 dark:border-white/[0.08] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Nav Links */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group focus:outline-hidden">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
              <Link2 className="w-4.5 h-4.5 -rotate-45" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight bg-linear-to-r from-zinc-900 via-indigo-950 to-zinc-800 dark:from-white dark:via-indigo-200 dark:to-cyan-200 bg-clip-text text-transparent">
                CtrlLink
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                PRO
              </span>
            </div>
          </Link>

          {isAuthenticated && (
            <nav className="hidden sm:flex items-center gap-1.5 text-xs font-semibold">
              <Link
                to="/"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  isHomeActive
                    ? 'bg-zinc-100 dark:bg-zinc-850 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60'
                }`}
              >
                <Link2 className="w-3.5 h-3.5 -rotate-45" />
                <span>Links &amp; Analytics</span>
              </Link>

              <Link
                to="/profile"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  isProfileActive
                    ? 'bg-zinc-100 dark:bg-zinc-850 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Profile</span>
              </Link>
            </nav>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/profile"
                className={`flex items-center gap-2 p-1 sm:px-3 sm:py-1.5 rounded-xl border transition-all duration-200 ${
                  isProfileActive
                    ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'bg-zinc-100/70 hover:bg-zinc-100 dark:bg-zinc-900/80 dark:hover:bg-zinc-850 border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-zinc-200'
                }`}
                title="View & Edit Profile"
              >
                <div className="w-7 h-7 rounded-lg overflow-hidden bg-linear-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xs uppercase shrink-0">
                  {user.profilePictureUrl && !user.profilePictureUrl.includes('cloudinaryService.') ? (
                    <img
                      src={user.profilePictureUrl}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{user.name ? user.name[0] : 'U'}</span>
                  )}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="font-semibold text-xs leading-tight truncate max-w-[110px]">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 max-w-[110px] truncate">
                    Settings
                  </span>
                </div>
              </Link>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                leftIcon={<LogOut className="w-3.5 h-3.5 text-rose-500" />}
                className="hover:border-rose-400/50 dark:hover:border-rose-500/40 hover:text-rose-600 dark:hover:text-rose-400"
              >
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
