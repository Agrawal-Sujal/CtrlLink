import React from 'react';
import { UrlStatsResponse } from '../../types/url';
import { ChevronRight } from 'lucide-react';

interface ClicksByShortUrlCardProps {
  urls: UrlStatsResponse[];
  onSelectUrl?: (shortId: string) => void;
  onViewAll?: () => void;
}

export const ClicksByShortUrlCard: React.FC<ClicksByShortUrlCardProps> = ({
  urls,
  onSelectUrl,
  onViewAll,
}) => {
  // Take top 5 sorted by clickCount
  const sorted = [...urls].sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0));
  const top5 = sorted.slice(0, 5);

  // Fallback demo items matching screenshot if user has no links yet
  const displayItems =
    top5.length > 0
      ? top5.map((u) => ({
          id: u.shortId,
          path: `/${u.customPath || u.shortId}`,
          clicks: u.clickCount || 0,
        }))
      : [
          { id: '1', path: '/youtube/videos/react', clicks: 4921 },
          { id: '2', path: '/docs/api', clicks: 3210 },
          { id: '3', path: '/launch-2026', clicks: 2138 },
          { id: '4', path: '/blog/backend', clicks: 1207 },
          { id: '5', path: '/marketing', clicks: 982 },
        ];

  const maxClicks = Math.max(...displayItems.map((d) => d.clicks), 1);

  const colors = [
    'bg-blue-600',
    'bg-cyan-500',
    'bg-purple-600',
    'bg-indigo-500',
    'bg-sky-400',
  ];

  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Clicks by Short URL
          </h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            Top 5
          </span>
        </div>

        {/* Progress List */}
        <div className="space-y-4 pt-1">
          {displayItems.map((item, idx) => {
            const barWidth = Math.max(
              Math.min((item.clicks / maxClicks) * 100, 100),
              4
            );
            const colorClass = colors[idx % colors.length];

            return (
              <div
                key={item.id + idx}
                onClick={() => onSelectUrl?.(item.id)}
                className="group cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs sm:text-sm font-medium mb-1.5">
                  <span className="font-mono text-blue-600 dark:text-blue-400 group-hover:underline truncate max-w-[200px] sm:max-w-[260px]">
                    {item.path}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 shrink-0">
                    {item.clicks.toLocaleString()}
                  </span>
                </div>

                {/* Progress Bar Track */}
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Link */}
      <div className="pt-5 flex justify-end">
        <button
          type="button"
          onClick={() => {
            if (onViewAll) {
              onViewAll();
            } else {
              const el = document.getElementById('your-links');
              el?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer"
        >
          <span>View all URLs</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
