import React, { useState } from 'react';
import {
  X,
  Folder,
  FolderPlus,
  Link2,
  Zap,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Lock,
  Calendar,
  MousePointerClick,
  ChevronRight,
  Search,
} from 'lucide-react';
import { FolderTreeNode, isCustomUrl } from '../../utils/folderTree';
import { UrlStatsResponse } from '../../types/url';
import { buildShortUrl } from '../../utils/url';

interface FolderDetailsDrawerProps {
  node: FolderTreeNode | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateModal: (targetFolder: string) => void;
  onDeleteFolder?: (folderPath: string) => void;
  onDeleteUrl: (shortId: string) => Promise<void>;
  onSelectSubfolder?: (subfolderPath: string) => void;
}

export const FolderDetailsDrawer: React.FC<FolderDetailsDrawerProps> = ({
  node,
  isOpen,
  onClose,
  onOpenCreateModal,
  onDeleteFolder,
  onDeleteUrl,
  onSelectSubfolder,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'custom' | 'auto' | 'folders'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen || !node) return null;

  const displayPath = node.isRoot ? '/ (Root)' : `/${node.fullPath}`;

  const handleCopyLink = async (url: UrlStatsResponse) => {
    const fullPath = url.customPath || url.shortId;
    const shortUrl = buildShortUrl(fullPath);
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedId(url.shortId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDelete = async (shortId: string) => {
    if (confirm('Are you sure you want to delete this shortened link?')) {
      setDeletingId(shortId);
      try {
        await onDeleteUrl(shortId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  // Filter links
  const filteredUrls = node.urls.filter((url) => {
    const isCustom = isCustomUrl(url);
    if (filterType === 'custom' && !isCustom) return false;
    if (filterType === 'auto' && isCustom) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchShort = (url.customPath || url.shortId).toLowerCase().includes(q);
      const matchLong = url.longUrl.toLowerCase().includes(q);
      const matchTitle = (url.title || '').toLowerCase().includes(q);
      return matchShort || matchLong || matchTitle;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#111827] border-l border-slate-200 dark:border-slate-800 shadow-2xl h-full flex flex-col slide-in-from-right duration-250 animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {node.name}
                </h2>
                {node.isRoot && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    Root
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {displayPath}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Stats Bar */}
        <div className="p-4 bg-white dark:bg-[#111827] border-b border-slate-100 dark:border-slate-800/80 space-y-3">
          {/* Stats Badges */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-center">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Custom URLs
              </div>
              <div className="text-base font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1 mt-0.5">
                <Link2 className="w-3.5 h-3.5 -rotate-45" />
                <span>{node.customUrlsCount}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-center">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Auto URLs
              </div>
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                <Zap className="w-3.5 h-3.5 fill-emerald-600/20" />
                <span>{node.autoUrlsCount}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-center">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Subfolders
              </div>
              <div className="text-base font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 mt-0.5">
                <Folder className="w-3.5 h-3.5" />
                <span>{node.children.length}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenCreateModal(node.fullPath)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm shadow-blue-500/20 cursor-pointer transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ Add to this folder</span>
            </button>

            {!node.isRoot && node.urls.length === 0 && node.children.length === 0 && onDeleteFolder && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Remove empty folder "${node.name}"?`)) {
                    onDeleteFolder(node.fullPath);
                    onClose();
                  }
                }}
                className="p-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/50 cursor-pointer transition-colors"
                title="Delete empty folder"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills & Search */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All URLs ({node.urls.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('custom')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                filterType === 'custom'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Link2 className="w-3 h-3 -rotate-45" />
              Custom ({node.customUrlsCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('auto')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                filterType === 'auto'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Zap className="w-3 h-3" />
              Auto ({node.autoUrlsCount})
            </button>
            {node.children.length > 0 && (
              <button
                type="button"
                onClick={() => setFilterType('folders')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                  filterType === 'folders'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Folder className="w-3 h-3" />
                Subfolders ({node.children.length})
              </button>
            )}
          </div>

          {filterType !== 'folders' && (
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search links in this folder..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs py-1.5 pl-8 pr-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filterType === 'folders' ? (
            /* Subfolders List */
            <div className="space-y-2">
              {node.children.map((child) => (
                <div
                  key={child.id}
                  onClick={() => onSelectSubfolder && onSelectSubfolder(child.fullPath)}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 bg-white dark:bg-slate-900/60 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Folder className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {child.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        /{child.fullPath}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {child.totalUrlsCount} URLs
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUrls.length === 0 ? (
            /* Empty State */
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
              <Link2 className="w-8 h-8 mx-auto stroke-1 opacity-60" />
              <p className="text-xs font-medium">No links in this folder</p>
              <button
                type="button"
                onClick={() => onOpenCreateModal(node.fullPath)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                + Add the first link
              </button>
            </div>
          ) : (
            /* Links List */
            filteredUrls.map((url) => {
              const isCustom = isCustomUrl(url);
              const fullPath = url.customPath || url.shortId;
              const displayShortUrl = buildShortUrl(fullPath);

              return (
                <div
                  key={url.shortId}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:shadow-xs transition-all space-y-2"
                >
                  {/* Top Row: Path & Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white truncate">
                          /{fullPath}
                        </span>
                        {isCustom ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                            <Link2 className="w-2.5 h-2.5 -rotate-45" />
                            Custom
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                            <Zap className="w-2.5 h-2.5 fill-emerald-600/20" />
                            Auto
                          </span>
                        )}
                        {url.passwordProtected && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
                            <Lock className="w-2.5 h-2.5" />
                            Pass
                          </span>
                        )}
                      </div>
                      {url.title && (
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate mt-0.5">
                          {url.title}
                        </div>
                      )}
                    </div>

                    {/* Copy and External Link buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(url)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Copy short link"
                      >
                        {copiedId === url.shortId ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <a
                        href={displayShortUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Open short link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        disabled={deletingId === url.shortId}
                        onClick={() => handleDelete(url.shortId)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        title="Delete link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Destination URL */}
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                    <span className="text-slate-400">Target:</span>
                    <a
                      href={url.longUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline hover:text-slate-700 dark:hover:text-slate-200 truncate"
                    >
                      {url.longUrl}
                    </a>
                  </div>

                  {/* Footer: Clicks & Date */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-1 font-medium">
                      <MousePointerClick className="w-3 h-3 text-blue-500" />
                      <span>{url.clickCount || 0} clicks</span>
                    </div>
                    {url.createdAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(url.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
