import React from 'react';
import { UrlStatsResponse } from '../../types/url';
import { ChevronRight, BarChart2 } from 'lucide-react';

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
  // Sort user's real links by clickCount descending
  const sorted = [...urls].sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0));
  const top5 = sorted.slice(0, 5);

  const maxClicks = Math.max(...top5.map((d) => d.clickCount || 0), 1);

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
            Top {top5.length > 0 ? top5.length : 5}
          </span>
        </div>

        {/* Progress List or Empty State */}
        {top5.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <BarChart2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              No shortened links yet
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Shorten your first link above to see click performance here.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {top5.map((item, idx) => {
              const displayPath = `/${item.customPath || item.shortId}`;
              const clicks = item.clickCount || 0;
              const barWidth =
                maxClicks > 0 && clicks > 0
                  ? Math.max(Math.min((clicks / maxClicks) * 100, 100), 4)
                  : 0;
              const colorClass = colors[idx % colors.length];

              return (
                <div
                  key={item.shortId}
                  onClick={() => onSelectUrl?.(item.shortId)}
                  className="group cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs sm:text-sm font-medium mb-1.5">
                    <span className="font-mono text-blue-600 dark:text-blue-400 group-hover:underline truncate max-w-[200px] sm:max-w-[260px]">
                      {displayPath}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 shrink-0">
                      {clicks.toLocaleString()}
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
        )}
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
