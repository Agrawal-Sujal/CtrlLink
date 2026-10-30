import React from 'react';
import { Link } from 'react-router-dom';
import { Link2, ShieldCheck, Sparkles } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  badge = 'Next-Gen URL Control',
}) => {
  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors duration-200 relative overflow-hidden">
      {/* Dynamic Background Glow Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[450px] h-[450px] rounded-full bg-cyan-500/10 dark:bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] rounded-full bg-purple-500/10 dark:bg-purple-600/10 blur-[120px] pointer-events-none" />

      {/* Grid Pattern overlay for tech aesthetic */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <Link to="/" className="group flex items-center gap-2.5 focus:outline-hidden">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
            <Link2 className="w-5 h-5 -rotate-45" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight bg-linear-to-r from-zinc-900 via-indigo-950 to-zinc-800 dark:from-white dark:via-indigo-200 dark:to-cyan-200 bg-clip-text text-transparent">
                CtrlLink
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                PRO
              </span>
            </div>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Smart URL &amp; Identity Platform
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="w-full bg-white dark:bg-[#121215] rounded-3xl border border-zinc-200/90 dark:border-white/[0.08] shadow-2xl shadow-zinc-200/50 dark:shadow-black/60 p-6 sm:p-8 transition-all duration-200">
            {/* Header info inside card */}
            <div className="text-center mb-6">
              {badge && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{badge}</span>
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Inner Form content */}
            {children}
          </div>

          {/* Secure Trust Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>End-to-end encrypted &amp; JWT secured access</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
        <p>&copy; {new Date().getFullYear()} CtrlLink. Built for high performance and link intelligence.</p>
      </footer>
    </div>
  );
};
