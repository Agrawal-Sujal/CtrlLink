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
  isLoading = false,
  onCopy,
  copiedId,
  onAnalytics,
  onEdit,
  onDelete,
  onVisit,
}) => {
  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1);
  const startIndex = (currentPage - 1) * pageSize;
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

  // Build page buttons list (up to 5 pages around current)
  const renderPaginationButtons = () => {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return pages.map((p, idx) => {
      if (p === '...') {
        return (
          <span key={`dots-${idx}`} className="px-1 text-slate-400">
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
              ? 'bg-blue-600 text-white'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
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
            {isLoading && links.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                  Loading your short links...
                </td>
              </tr>
            ) : links.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center space-y-2">
                  <Link2 className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 -rotate-45" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    No short links found
                  </p>
                  <p className="text-xs text-slate-400">
                    {search || selectedTag !== 'all'
                      ? 'No links match your search/tag filter.'
                      : 'Create your first short link using the quick shorten form above!'}
                  </p>
                </td>
              </tr>
            ) : (
              links.map((item) => {
                const displayPath = item.customPath || item.shortId;
                const isCopied = copiedId === item.shortId;

                return (
                  <tr
                    key={item.shortId}
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

      {/* Footer: Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <div>
          {totalCount > 0
            ? `Showing ${startIndex + 1} to ${endIndex} of ${totalCount} links`
            : '0 links'}
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              className="px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium cursor-pointer"
            >
              Previous
            </button>

            {renderPaginationButtons()}

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
              className="px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
