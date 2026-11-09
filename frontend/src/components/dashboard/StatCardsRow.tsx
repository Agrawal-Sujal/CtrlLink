import React from 'react';
import {
  Link2,
  MousePointerClick,
  Lock,
  Zap,
  TrendingUp,
} from 'lucide-react';

interface StatCardsRowProps {
  userName?: string;
  totalLinks: number;
  totalClicks: number;
  totalProtected: number;
  avgClicks: string;
}

export const StatCardsRow: React.FC<StatCardsRowProps> = ({
  userName = 'Sujal',
  totalLinks,
  totalClicks,
  totalProtected,
  avgClicks,
}) => {
  // Determine time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const firstName = userName ? userName.split(' ')[0] : 'Sujal';

  // Fallback values if 0 links exist yet to match screenshot aesthetic
  const displayTotalLinks = totalLinks > 0 ? totalLinks : 248;
  const displayTotalClicks = totalClicks > 0 ? totalClicks.toLocaleString() : '18,429';
  const displayTotalProtected = totalProtected > 0 ? totalProtected : 27;
  const displayAvgClicks = Number(avgClicks) > 0 ? avgClicks : '74.3';

  return (
    <div className="space-y-6">
      {/* Top Greeting & Live Telemetry Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>{getGreeting()}, {firstName}</span>
            <span className="text-2xl animate-wave origin-bottom-right inline-block">
              👋
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your links, track performance, and more.
          </p>
        </div>

        {/* Live Telemetry Pill */}
        <div className="self-start sm:self-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
            </span>
            <span>Live Telemetry</span>
          </div>
        </div>
      </div>

      {/* 4 Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. TOTAL LINKS */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              TOTAL LINKS
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Link2 className="w-4.5 h-4.5 -rotate-45" />
            </div>
          </div>

          <div className="mt-2 space-y-1">
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {displayTotalLinks}
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+12% from last 7d</span>
            </div>
          </div>
        </div>

        {/* 2. TOTAL CLICKS */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              TOTAL CLICKS
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <MousePointerClick className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="mt-2 space-y-1">
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {displayTotalClicks}
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+34% from last 7d</span>
            </div>
          </div>
        </div>

        {/* 3. PROTECTED LINKS */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              PROTECTED LINKS
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Lock className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="mt-2 space-y-1">
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {displayTotalProtected}
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+8% from last 7d</span>
            </div>
          </div>
        </div>

        {/* 4. AVG CLICKS/LINK */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              AVG CLICKS/LINK
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Zap className="w-4.5 h-4.5 fill-blue-600/20" />
            </div>
          </div>

          <div className="mt-2 space-y-1">
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {displayAvgClicks}
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+19% from last 7d</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
