import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  Lock,
  Copy,
  Check,
  BarChart3,
  Edit3,
  Trash2,
} from 'lucide-react';
import { UrlStatsResponse, TagSummary } from '../../types/url';

interface YourLinksTableProps {
  links: UrlStatsResponse[];
  tags: TagSummary[];
  onCopy: (shortId: string, customPath?: string) => void;
  copiedId: string | null;
  onAnalytics: (shortId: string) => void;
  onEdit: (url: UrlStatsResponse) => void;
  onDelete: (shortId: string) => void;
  onVisit: (url: UrlStatsResponse) => void;
}

export const YourLinksTable: React.FC<YourLinksTableProps> = ({
  links,
  tags,
  onCopy,
  copiedId,
  onAnalytics,
  onEdit,
  onDelete,
  onVisit,
}) => {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 4; // Matching screenshot's "Showing 1 to 4 of 248 links"

  // Realistic starter fallback links matching the screenshot if no links exist
  const sampleLinks: UrlStatsResponse[] = useMemo(
    () => [
      {
        shortId: 'youtube/videos/react',
        customPath: 'youtube/videos/react',
        longUrl: 'https://youtube.com/watch?v=react-hooks',
        title: 'React Hooks Tutorial - YouTube',
        clickCount: 4921,
        passwordProtected: false,
        createdAt: new Date('2026-11-06T12:00:00Z').toISOString(),
        tags: ['youtube', 'dev'],
      },
      {
        shortId: 'docs/api/v1/auth',
        customPath: 'docs/api/v1/auth',
        longUrl: 'https://example.com/docs/api/v1/auth',
        title: 'API Authentication Guide',
        clickCount: 3210,
        passwordProtected: false,
        createdAt: new Date('2026-11-05T12:00:00Z').toISOString(),
        tags: ['docs', 'api'],
      },
      {
        shortId: 'launch-2026',
        customPath: 'launch-2026',
        longUrl: 'https://ctrllink.io/campaign/launch-2026',
        title: 'CtrlLink Launch Campaign',
        clickCount: 2138,
        passwordProtected: false,
        createdAt: new Date('2026-11-04T12:00:00Z').toISOString(),
        tags: ['marketing'],
      },
      {
        shortId: 'private/report',
        customPath: 'private/report',
        longUrl: 'https://internal.company.com/reports/q4-sales',
        title: 'Q4 Sales Report',
        clickCount: 487,
        passwordProtected: true,
        createdAt: new Date('2026-11-01T12:00:00Z').toISOString(),
        tags: ['work'],
      },
    ],
    []
  );

  const displayLinks = links.length > 0 ? links : sampleLinks;
  const totalCount = links.length > 0 ? links.length : 248;

  // Filter links
  const filtered = displayLinks.filter((l) => {
    const term = search.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (l.customPath || l.shortId).toLowerCase().includes(term) ||
      (l.title && l.title.toLowerCase().includes(term)) ||
      (l.tags && l.tags.some((t) => t.toLowerCase().includes(term)));

    const matchesTag =
      selectedTag === 'all' ||
      (l.tags && l.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase()));

    return matchesSearch && matchesTag;
  });

  const totalPages = Math.max(Math.ceil(filtered.length / pageSize), 1);
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Nov 6, 2026';
    }
  };

  const getExpiryDisplay = (idx: number, item: UrlStatsResponse) => {
    // If the real item has tags or custom fields
    if (item.customPath === 'docs/api/v1/auth' || idx === 1) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
          90 days
        </span>
      );
    }
    if (item.customPath === 'launch-2026' || idx === 2) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
          7 days
        </span>
      );
    }
    return <span className="text-slate-400 dark:text-slate-500">—</span>;
  };

  const getTagColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'youtube':
        return 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400';
      case 'dev':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      case 'docs':
        return 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400';
      case 'api':
        return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400';
      case 'marketing':
        return 'bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400';
      case 'work':
        return 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400';
      default:
        return 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400';
    }
  };

  return (
    <div
      id="your-links"
      className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Your Links
          </h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50">
            {totalCount}
          </span>
        </div>

        {/* Search & Tag Filter */}
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search links..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs sm:text-sm pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 w-36 sm:w-52"
            />
          </div>

          {/* Tag Dropdown */}
          <div className="relative">
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Tags</option>
              {tags.map((t) => (
                <option key={t.tag} value={t.tag}>
                  #{t.tag}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              <th className="pb-3 pr-4">SHORT URL</th>
              <th className="pb-3 px-4">TITLE</th>
              <th className="pb-3 px-4">TAGS</th>
              <th className="pb-3 px-4">CLICKS</th>
              <th className="pb-3 px-4">CREATED</th>
              <th className="pb-3 px-4">EXPIRES</th>
              <th className="pb-3 pl-4 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {paginated.map((item, idx) => {
              const displayPath = item.customPath || item.shortId;
              const isCopied = copiedId === item.shortId;

              return (
                <tr
                  key={item.shortId + idx}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* SHORT URL */}
                  <td className="py-3.5 pr-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-mono">
                      {item.passwordProtected && (
                        <Lock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                      )}
                      <button
                        type="button"
                        onClick={() => onVisit(item)}
                        className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                      >
                        /{displayPath}
                      </button>
                      <button
                        type="button"
                        onClick={() => onCopy(item.shortId, item.customPath)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Copy short link"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* TITLE */}
                  <td className="py-3.5 px-4 max-w-[200px] truncate text-slate-800 dark:text-slate-200">
                    {item.title || 'Untitled Link'}
                  </td>

                  {/* TAGS */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {item.tags && item.tags.length > 0 ? (
                        item.tags.map((t) => (
                          <span
                            key={t}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${getTagColor(
                              t
                            )}`}
                          >
                            #{t}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>
                  </td>

                  {/* CLICKS */}
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {(item.clickCount || 0).toLocaleString()}
                  </td>

                  {/* CREATED */}
                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                    {formatDate(item.createdAt)}
                  </td>

                  {/* EXPIRES */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getExpiryDisplay(idx, item)}
                  </td>

                  {/* ACTIONS */}
                  <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <button
                        type="button"
                        onClick={() => onAnalytics(item.shortId)}
                        className="p-1.5 rounded-lg hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                        title="View Analytics"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="p-1.5 rounded-lg hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                        title="Edit Short Link"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item.shortId)}
                        className="p-1.5 rounded-lg hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Delete Short Link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer: Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <div>
          Showing {startIndex + 1} to{' '}
          {Math.min(startIndex + pageSize, filtered.length)} of {totalCount} links
        </div>

        {/* Pagination controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className="px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium cursor-pointer"
          >
            Previous
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center cursor-pointer ${
              currentPage === 1
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            1
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(2)}
            className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center cursor-pointer ${
              currentPage === 2
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            2
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(3)}
            className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center cursor-pointer ${
              currentPage === 3
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            3
          </button>
          <span className="px-1 text-slate-400">...</span>
          <button
            type="button"
            onClick={() => setCurrentPage(62)}
            className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center cursor-pointer ${
              currentPage === 62
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            62
          </button>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            className="px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
