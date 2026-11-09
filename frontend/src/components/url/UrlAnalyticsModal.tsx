import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  MousePointerClick,
  Clock,
  TrendingUp,
  Globe,
  Compass,
  Smartphone,
  Copy,
  Check,
  BarChart3,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { urlApi, getErrorMessage } from '../../services/api';
import { UrlStatsResponse } from '../../types/url';
import { useTheme } from '../../context/ThemeContext';
import { AlertBanner } from '../AlertBanner';

interface UrlAnalyticsModalProps {
  shortId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

type RangeType = 'all' | '7d' | '24h';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const UrlAnalyticsModal: React.FC<UrlAnalyticsModalProps> = ({
  shortId,
  isOpen,
  onClose,
}) => {
  const { resolvedTheme } = useTheme();
  const [range, setRange] = useState<RangeType>('all');
  const [stats, setStats] = useState<UrlStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && shortId) {
      loadStats(shortId, range);
    }
  }, [isOpen, shortId, range]);

  const loadStats = async (id: string, selectedRange: RangeType) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await urlApi.getStats(id, selectedRange);
      setStats(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !shortId) return null;

  const isDark = resolvedTheme === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : '#f4f4f5';
  const axisColor = isDark ? '#71717a' : '#a1a1aa';
  const tooltipBg = isDark ? '#18181b' : '#ffffff';
  const tooltipBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : '#e4e4e7';

  const PIE_COLORS = ['#6366f1', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6'];

  // Convert timeSeries map to sorted chart array
  const timeSeriesData = stats?.timeSeries
    ? Object.entries(stats.timeSeries)
        .map(([key, value]) => ({
          time: key.length > 10 ? key.slice(5) : key,
          fullTime: key,
          clicks: value,
        }))
        .sort((a, b) => a.fullTime.localeCompare(b.fullTime))
    : [];

  // Convert countries map
  const countriesData = stats?.countries
    ? Object.entries(stats.countries).map(([name, value]) => ({
        name: name || 'Unknown',
        value,
      }))
    : [];

  // Convert referrers map
  const referrersData = stats?.referrers
    ? Object.entries(stats.referrers).map(([name, value]) => ({
        name: name || 'Direct',
        value,
      }))
    : [];

  // Convert devices map
  const devicesData = stats?.devices
    ? Object.entries(stats.devices).map(([name, value]) => ({
        name: name || 'Desktop',
        value,
      }))
    : [];

  // Growth calculation: clicks over days active
  const calculateGrowth = () => {
    if (!stats || !stats.createdAt) return '0 / day';
    const createdDate = new Date(stats.createdAt);
    const now = new Date();
    const diffDays = Math.max(1, Math.round((now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24)));
    const rate = ((stats.clickCount || 0) / diffDays).toFixed(1);
    return `+${rate} clicks/day`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${API_BASE_URL}/redirect/${stats?.customPath || shortId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-white/[0.08] shadow-2xl p-6 sm:p-8 space-y-6 text-zinc-900 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-white/[0.06] pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-indigo-600 dark:text-indigo-400">
                /{shortId}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 rounded-md text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                title="Copy link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">
              {stats?.title || 'Link Analytics & Insights'}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate max-w-md">
              {stats?.longUrl}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            )}
            {/* Time Range Selector */}
            <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-white/[0.08] text-xs font-semibold">
              <button
                type="button"
                onClick={() => setRange('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  range === 'all'
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => setRange('7d')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  range === '7d'
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setRange('24h')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  range === '24h'
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                24 Hours
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <AlertBanner
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181b] border-t-2 border-t-indigo-500 border border-zinc-200/80 dark:border-white/[0.06] space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
              <MousePointerClick className="w-4 h-4" />
              <span>Total Clicks</span>
            </div>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">
              {stats?.clickCount?.toLocaleString() || 0}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181b] border-t-2 border-t-cyan-500 border border-zinc-200/80 dark:border-white/[0.06] space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-cyan-600 dark:text-cyan-400 font-semibold">
              <Clock className="w-4 h-4" />
              <span>Last Click</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">
              {stats?.lastAccessedTime
                ? new Date(stats.lastAccessedTime).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'No clicks yet'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181b] border-t-2 border-t-purple-500 border border-zinc-200/80 dark:border-white/[0.06] space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-semibold">
              <Calendar className="w-4 h-4" />
              <span>Created</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">
              {stats?.createdAt
                ? new Date(stats.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '—'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181b] border-t-2 border-t-emerald-500 border border-zinc-200/80 dark:border-white/[0.06] space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <TrendingUp className="w-4 h-4" />
              <span>Velocity Growth</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">
              {calculateGrowth()}
            </p>
          </div>
        </div>

        {/* Click Activity Frequency Chart (Area Chart) */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200/80 dark:border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                Click Activity Frequency
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Frequency of user interaction over selected period ({range === 'all' ? 'All Time' : range}).
              </p>
            </div>
          </div>

          <div className="w-full h-56 sm:h-64">
            {timeSeriesData.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-xs text-zinc-400">
                <MousePointerClick className="w-8 h-8 mb-2 opacity-40 text-indigo-500" />
                <span>No click interactions recorded during this period.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="clickColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="time" stroke={axisColor} fontSize={11} tickLine={false} />
                  <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div
                            style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }}
                            className="p-2.5 rounded-xl border shadow-xl text-xs space-y-1"
                          >
                            <p className="text-zinc-400">{payload[0].payload.fullTime}</p>
                            <p className="font-bold text-indigo-500 text-sm">
                              {payload[0].value} clicks
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#clickColor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Charts Grid: Geo, Referrers, Devices */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Geo Distribution */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200/80 dark:border-white/[0.08] space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-500" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Geo Distribution
              </h4>
            </div>

            <div className="w-full h-44 flex items-center justify-center">
              {countriesData.length === 0 ? (
                <p className="text-xs text-zinc-400">No geo data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={countriesData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      paddingAngle={4}
                    >
                      {countriesData.map((_, idx) => (
                        <Cell key={`geo-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div
                              style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }}
                              className="p-2 rounded-lg border text-xs"
                            >
                              <span className="font-semibold">{payload[0].name}: </span>
                              <span className="text-indigo-500">{payload[0].value}</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* 2. Referral Sources */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200/80 dark:border-white/[0.08] space-y-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-purple-500" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Referral Sources
              </h4>
            </div>

            <div className="w-full h-44 flex items-center justify-center">
              {referrersData.length === 0 ? (
                <p className="text-xs text-zinc-400">No referrers recorded</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={referrersData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      paddingAngle={4}
                    >
                      {referrersData.map((_, idx) => (
                        <Cell key={`ref-${idx}`} fill={PIE_COLORS[(idx + 2) % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div
                              style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }}
                              className="p-2 rounded-lg border text-xs"
                            >
                              <span className="font-semibold">{payload[0].name}: </span>
                              <span className="text-purple-500">{payload[0].value}</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* 3. Device & Browser */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200/80 dark:border-white/[0.08] space-y-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Device Types
              </h4>
            </div>

            <div className="w-full h-44 flex items-center justify-center">
              {devicesData.length === 0 ? (
                <p className="text-xs text-zinc-400">No device data</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={devicesData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      paddingAngle={4}
                    >
                      {devicesData.map((_, idx) => (
                        <Cell key={`dev-${idx}`} fill={PIE_COLORS[(idx + 4) % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div
                              style={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }}
                              className="p-2 rounded-lg border text-xs"
                            >
                              <span className="font-semibold">{payload[0].name}: </span>
                              <span className="text-emerald-500">{payload[0].value}</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
