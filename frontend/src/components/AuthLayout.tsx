import React from 'react';
import { Link } from 'react-router-dom';
import {
  Link2,
  ShieldCheck,
  Sparkles,
  MousePointerClick,
  Lock,
  Zap,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';
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
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#F4F6FB] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors duration-200 relative selection:bg-blue-500 selection:text-white">
      {/* Ambient background glow */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-500/[0.06] via-blue-500/[0.015] to-transparent pointer-events-none" />

      {/* Subtle dot pattern matching tech aesthetic */}
      <div
        className="absolute inset-0 opacity-[0.025] dark:opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        {/* Brand Logo matching dashboard top-left */}
        <Link to="/" className="group flex items-center gap-3 focus:outline-hidden">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30 group-hover:scale-105 transition-transform duration-200">
            <Link2 className="w-5 h-5 -rotate-45 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                CtrlLink
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40">
                PRO
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Smart URL &amp; Identity Platform
            </span>
          </div>
        </Link>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Live Telemetry badge from dashboard top-right */}
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            <span>Live Telemetry</span>
          </div>

          {/* Theme Toggle matching bottom sidebar widget in design */}
          <ThemeToggle showLabel />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Form Card */}
          <div className="w-full max-w-md mx-auto lg:col-span-6 lg:max-w-none">
            <div className="w-full bg-white dark:bg-[#111827] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 sm:p-9 transition-all duration-200">
              {/* Header inside card */}
              <div className="text-center mb-6">
                {badge && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 mb-3 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{badge}</span>
                  </div>
                )}
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Form Content */}
              {children}
            </div>

            {/* Secure Trust Badge */}
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>End-to-end encrypted &amp; JWT secured link infrastructure</span>
            </div>
          </div>

          {/* Right Column (Desktop): Interactive Platform Showcase matching Dashboard */}
          <div className="hidden lg:flex lg:col-span-6 flex-col gap-5 pl-4">
            {/* Top Showcase Banner */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Next-Gen Link Telemetry</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Complete control over every link you share.
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Experience real-time analytics, custom folder routing, and password-protected URLs designed for teams and high-growth brands.
              </p>
            </div>

            {/* Dashboard Mini Stat Cards Matrix (directly replicating the screenshot) */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Stat 1: Total Links */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Total Links
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Link2 className="w-4 h-4 -rotate-45" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">248</span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                    ↗ +12%
                  </span>
                </div>
              </div>

              {/* Stat 2: Total Clicks */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Total Clicks
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                    <MousePointerClick className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">18,429</span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                    ↗ +34%
                  </span>
                </div>
              </div>

              {/* Stat 3: Protected Links */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Protected Links
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">27</span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                    ↗ +8%
                  </span>
                </div>
              </div>

              {/* Stat 4: Avg Clicks */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Avg Clicks/Link
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">74.3</span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                    ↗ +19%
                  </span>
                </div>
              </div>
            </div>

            {/* Link Preview Card from the dashboard */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                    /youtube/videos/react
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  4,921 clicks
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                React Hooks Tutorial - Official Guide &amp; Masterclass
              </p>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                  #youtube
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                  #react
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                  #dev
                </span>
              </div>
            </div>

            {/* Trust feature points */}
            <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Custom Nested Aliases</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Real-Time Click Heatmaps</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Password &amp; Expiry TTL</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Instant High-Res QR Codes</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-5 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>&copy; {new Date().getFullYear()} CtrlLink. Built for high performance &amp; link intelligence.</p>
          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
            <span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">Privacy Policy</span>
            <span>&bull;</span>
            <span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">Terms of Service</span>
            <span>&bull;</span>
            <span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
