import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Link2,
  Tag,
  User,
  Sun,
  Moon,
  X,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = false,
  onClose,
  className = '',
}) => {
  const location = useLocation();
  const { resolvedTheme, setTheme } = useTheme();

  const isDashboardActive = location.pathname === '/' || location.pathname === '/dashboard';
  const isTagsActive = location.pathname === '/tags';
  const isProfileActive = location.pathname === '/profile';

  const navItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      to: '/',
      isActive: isDashboardActive,
    },
    {
      label: 'Links',
      icon: Link2,
      to: '/#your-links',
      isActive: false,
      onClick: () => {
        if (location.pathname === '/' || location.pathname === '/dashboard') {
          const el = document.getElementById('your-links');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }
      },
    },
    {
      label: 'Tags',
      icon: Tag,
      to: '/tags',
      isActive: isTagsActive,
    },
    // NOTE: As requested by the user, the Analytics tab is intentionally omitted.
    {
      label: 'Profile',
      icon: User,
      to: '/profile',
      isActive: isProfileActive,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4 sm:p-5 select-none">
      {/* Top brand header & nav links */}
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-2.5 group focus:outline-hidden"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <Link2 className="w-4.5 h-4.5 -rotate-45 stroke-[2.5]" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
              CtrlLink
            </span>
          </Link>

          {/* Close button for mobile drawer */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                  }
                  if (onClose) {
                    onClose();
                  }
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  item.isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon
                  className={`w-4.5 h-4.5 ${
                    item.label === 'Links' ? '-rotate-45' : ''
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom theme switch and version info */}
      <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
        {/* Theme pill matching screenshot */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 pl-1">
            <Sun className="w-4 h-4 text-slate-400" />
            <span>Theme</span>
          </div>

          <div className="flex items-center p-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                resolvedTheme === 'light'
                  ? 'bg-slate-100 text-blue-600 dark:bg-slate-700 dark:text-blue-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="Light theme"
              aria-label="Switch to light mode"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                resolvedTheme === 'dark'
                  ? 'bg-slate-700 text-blue-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
              title="Dark theme"
              aria-label="Switch to dark mode"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Footer CtrlLink v1.0.0 */}
        <div className="flex items-center justify-between px-1 text-xs text-slate-400 dark:text-slate-500">
          <span className="font-medium">CtrlLink</span>
          <span className="font-mono text-[11px]">v1.0.0</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside
        className={`hidden lg:flex flex-col w-56 xl:w-60 shrink-0 h-screen sticky top-0 bg-white dark:bg-[#0f1422] border-r border-slate-200/80 dark:border-slate-800/80 z-30 ${className}`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer with backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-[#0f1422] shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
