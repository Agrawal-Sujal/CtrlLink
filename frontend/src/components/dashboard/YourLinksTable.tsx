import React from 'react';
import {
  Search,
  ChevronDown,
  Lock,
  Copy,
  Check,
  BarChart3,
  Edit3,
  Trash2,
  Loader2,
  Link2,
  ExternalLink,
} from 'lucide-react';
import { UrlStatsResponse, TagSummary } from '../../types/url';

interface YourLinksTableProps {
  links: UrlStatsResponse[];
  totalCount: number;
  tags: TagSummary[];
  search: string;
  onSearchChange: (val: string) => void;
  selectedTag: string;
  onSelectTag: (val: string) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  isLoading?: boolean;
  onCopy: (shortId: string, customPath?: string) => void;
  copiedId: string | null;
  onAnalytics: (shortId: string) => void;
  onEdit: (url: UrlStatsResponse) => void;
  onDelete: (shortId: string) => void;
  onVisit: (url: UrlStatsResponse) => void;
}

export const YourLinksTable: React.FC<YourLinksTableProps> = ({
  links,
  totalCount,
  tags,
  search,
  onSearchChange,
  selectedTag,
  onSelectTag,
  currentPage,
  onPageChange,
  pageSize = 10,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  isLoading = false,
  onCopy,
  copiedId,
  onAnalytics,
  onEdit,
  onDelete,
  onVisit,
}) => {
  // Decide total pages purely on the basis of total links
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;
  const startIndex = totalCount > 0 ? (currentPage - 1) * pageSize : 0;
  const endIndex = Math.min(startIndex + links.length, totalCount);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  const getExpiryDisplay = (expiryTime?: string) => {
    if (!expiryTime) {
      return <span className="text-slate-400 dark:text-slate-500">—</span>;
    }

    try {
      const expDate = new Date(expiryTime);
      const diffMs = expDate.getTime() - Date.now();

      if (diffMs <= 0) {
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
            Expired
          </span>
        );
      }

      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays > 1) {
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
            {diffDays} days
          </span>
        );
      }

      const diffHours = Math.max(Math.ceil(diffMs / (1000 * 60 * 60)), 1);
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
          {diffHours}h left
        </span>
      );
    } catch {
      return <span className="text-slate-400 dark:text-slate-500">—</span>;
    }
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

  // Build page buttons list strictly based on totalPages
  const renderPaginationButtons = () => {
    if (totalPages < 1) return null;
    if (totalPages === 1) {
      return (
        <button
          type="button"
          disabled
          className="w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center bg-blue-600 text-white shadow-xs cursor-default"
          aria-current="page"
        >
          1
        </button>
      );
    }

    const getPaginationRange = (current: number, total: number): (number | string)[] => {
      if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
      }
      if (current <= 4) {
        return [1, 2, 3, 4, 5, '...', total];
      }
      if (current >= total - 3) {
        return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
      }
      return [1, '...', current - 1, current, current + 1, '...', total];
    };

    const pages = getPaginationRange(currentPage, totalPages);

    return pages.map((p, idx) => {
      if (p === '...') {
        return (
          <span key={`dots-${idx}`} className="px-1 text-slate-400 select-none">
            ...
          </span>
        );
      }
      const pageNum = p as number;
      return (
        <button
          key={`page-${pageNum}`}
          type="button"
          onClick={() => onPageChange(pageNum)}
          className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center cursor-pointer transition-colors ${
            currentPage === pageNum
              ? 'bg-blue-600 text-white shadow-xs'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
          aria-current={currentPage === pageNum ? 'page' : undefined}
        >
          {pageNum}
        </button>
      );
    });
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
          {isLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
          )}
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
              onChange={(e) => onSearchChange(e.target.value)}
              className="text-xs sm:text-sm pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 w-36 sm:w-52"
            />
          </div>

          {/* Tag Dropdown */}
          <div className="relative">
            <select
              value={selectedTag}
              onChange={(e) => onSelectTag(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Tags</option>
              {tags.map((t) => (
                <option key={t.tag} value={t.tag}>
                  #{t.tag} ({t.count})
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
              <th className="pb-3 pr-2 w-10 text-center">#</th>
              <th className="pb-3 pr-4">SHORT URL</th>
              <th className="pb-3 px-4">TITLE &amp; DESTINATION</th>
              <th className="pb-3 px-4">TAGS</th>
              <th className="pb-3 px-4">CLICKS</th>
              <th className="pb-3 px-4">CREATED</th>
              <th className="pb-3 px-4">EXPIRES</th>
              <th className="pb-3 pl-4 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {isLoading && links.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                  Loading your short links...
                </td>
              </tr>
            ) : links.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center space-y-2">
                  <Link2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 -rotate-45" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    No short links found
                  </p>
                  <p className="text-xs text-slate-400">
                    {search || selectedTag !== 'all'
                      ? 'No links match your search/tag filter.'
                      : 'No short links found. Create your first short link to get started!'}
                  </p>
                </td>
              </tr>
            ) : (
              links.map((item, idx) => {
                const displayPath = item.customPath || item.shortId;
                const isCopied = copiedId === item.shortId;
                const rowNumber = startIndex + idx + 1;

                return (
                  <tr
                    key={item.shortId}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* ROW INDEX (#) */}
                    <td className="py-3.5 pr-2 w-10 text-center text-xs font-semibold text-slate-400 dark:text-slate-500 font-mono select-none">
                      {rowNumber}
                    </td>

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
                          /redirect/{displayPath}
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

                    {/* TITLE & DESTINATION URL */}
                    <td className="py-3.5 px-4 max-w-[280px]">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {item.title || 'Untitled Link'}
                      </div>
                      <a
                        href={item.longUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 truncate flex items-center gap-1 mt-0.5"
                        title={item.longUrl}
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{item.longUrl}</span>
                      </a>
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
                      {getExpiryDisplay(item.expiryTime)}
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
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer: Pagination & Links per page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div>
            {totalCount > 0
              ? `Showing ${startIndex + 1} to ${endIndex} of ${totalCount} links`
              : '0 links'}
          </div>

          {totalCount > 0 && onPageSizeChange && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
              <label htmlFor="links-per-page" className="text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Links per page:
              </label>
              <div className="relative">
                <select
                  id="links-per-page"
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="appearance-none pl-2.5 pr-6 py-1 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-hidden cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  {pageSizeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Pagination controls */}
        {totalCount > 0 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              className="px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium cursor-pointer transition-colors"
              title="Previous page"
            >
              Previous
            </button>

            {renderPaginationButtons()}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
              className="px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium cursor-pointer transition-colors"
              title="Next page"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
