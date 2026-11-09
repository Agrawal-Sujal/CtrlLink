import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { ChevronDown, Loader2 } from 'lucide-react';

interface ClickTimelineCardProps {
  timeSeriesData: Record<string, number>;
  range: '7d' | '30d' | '90d';
  onRangeChange: (r: '7d' | '30d' | '90d') => void;
  isLoading?: boolean;
}

export const ClickTimelineCard: React.FC<ClickTimelineCardProps> = ({
  timeSeriesData,
  range,
  onRangeChange,
  isLoading = false,
}) => {
  const { resolvedTheme } = useTheme();

  // Prepare time-series data using ONLY real backend timeSeriesData
  const daysCount = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const now = new Date();
  const chartData: { date: string; iso: string; clicks: number }[] = [];

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split('T')[0];
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = d.getDate();
    const label = `${monthName} ${dayNum}`;

    // Purely real data from backend response:
    const clicks = timeSeriesData[iso] || 0;

    chartData.push({
      date: label,
      iso,
      clicks,
    });
  }

  const totalClicksInPeriod = chartData.reduce((acc, c) => acc + c.clicks, 0);

  const isDark = resolvedTheme === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9';
  const tickColor = isDark ? '#94a3b8' : '#94a3b8';

  const formatYAxis = (val: number) => {
    if (val >= 1000) return `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}K`;
    return String(val);
  };

  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Click Timeline
          </h3>
          {isLoading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
          )}
        </div>

        {/* Range Dropdown */}
        <div className="relative">
          <select
            value={range}
            onChange={(e) => onRangeChange(e.target.value as '7d' | '30d' | '90d')}
            className="appearance-none pl-3 pr-7 py-1 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-56 pt-2 relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="clickTimelineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={gridColor}
            />
            <XAxis
              dataKey="date"
              stroke={tickColor}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={6}
            />
            <YAxis
              stroke={tickColor}
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYAxis}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="p-2.5 rounded-xl bg-slate-900/95 dark:bg-slate-800/95 text-white shadow-xl text-xs backdrop-blur-md border border-slate-800">
                      <p className="text-[10px] text-slate-400 font-medium">
                        {payload[0].payload.date}
                      </p>
                      <p className="font-bold text-sm text-blue-400">
                        {payload[0].value?.toLocaleString()} clicks
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
              stroke="#2563eb"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#clickTimelineGradient)"
              activeDot={{
                r: 5,
                fill: '#2563eb',
                stroke: '#ffffff',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>

        {totalClicksInPeriod === 0 && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 bg-white/80 dark:bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-200/60 dark:border-slate-800">
              0 clicks recorded in this period
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
