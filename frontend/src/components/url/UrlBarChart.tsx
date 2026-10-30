import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { UrlStatsResponse } from '../../types/url';
import { useTheme } from '../../context/ThemeContext';
import { BarChart3, MousePointerClick } from 'lucide-react';

interface UrlBarChartProps {
  urls: UrlStatsResponse[];
  onSelectUrl?: (shortId: string) => void;
}

export const UrlBarChart: React.FC<UrlBarChartProps> = ({ urls, onSelectUrl }) => {
  const { resolvedTheme } = useTheme();

  if (!urls || urls.length === 0) {
    return null;
  }

  // Format data for chart
  const data = urls.slice(0, 15).map((u) => ({
    shortId: u.shortId,
    displayName: u.title ? (u.title.length > 12 ? `${u.title.slice(0, 12)}…` : u.title) : `/${u.shortId}`,
    fullTitle: u.title || `/${u.shortId}`,
    clicks: u.clickCount || 0,
    longUrl: u.longUrl,
  }));

  const isDark = resolvedTheme === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : '#f4f4f5';
  const axisColor = isDark ? '#71717a' : '#a1a1aa';
  const tooltipBg = isDark ? '#18181b' : '#ffffff';
  const tooltipBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : '#e4e4e7';

  const barColors = [
    '#6366f1', // Electric Indigo
    '#06b6d4', // Vibrant Cyan
    '#8b5cf6', // Violet
    '#3b82f6', // Bright Blue
    '#10b981', // Emerald
    '#ec4899', // Pink
    '#f59e0b', // Amber
  ];

  const totalClicksAll = urls.reduce((acc, curr) => acc + (curr.clickCount || 0), 0);

  return (
    <div className="rounded-3xl p-6 sm:p-7 bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-white/[0.08] shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-white/[0.06] pb-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            Click Performance by Short URL
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            X-axis displays short URLs / titles, Y-axis displays total clicks generated.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-700 dark:text-indigo-300 self-start sm:self-auto">
          <MousePointerClick className="w-4 h-4 text-cyan-500" />
          <span>Total Clicks: {totalClicksAll.toLocaleString()}</span>
        </div>
      </div>

      <div className="w-full h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 20, left: -10, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="displayName"
              stroke={axisColor}
              fontSize={12}
              tickLine={false}
              angle={-20}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              stroke={axisColor}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div
                      style={{
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                      }}
                      className="p-3.5 rounded-2xl border shadow-2xl text-xs space-y-1.5 backdrop-blur-md"
                    >
                      <p className="font-bold text-zinc-900 dark:text-white">{item.fullTitle}</p>
                      <p className="text-indigo-500 font-mono font-medium">/{item.shortId}</p>
                      <p className="text-zinc-600 dark:text-zinc-300 font-semibold">
                        Clicks:{' '}
                        <span className="text-cyan-500 font-bold">{item.clicks}</span>
                      </p>
                      <p className="text-zinc-400 truncate max-w-[220px] text-[11px] pt-1">
                        {item.longUrl}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="clicks"
              radius={[8, 8, 0, 0]}
              onClick={(entry: any) => {
                const targetId = entry?.shortId || entry?.payload?.shortId;
                if (targetId) onSelectUrl?.(targetId);
              }}
              className="cursor-pointer"
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={barColors[index % barColors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
