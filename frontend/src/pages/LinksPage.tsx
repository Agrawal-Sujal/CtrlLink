import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { logger } from '../utils/logger';
import confetti from 'canvas-confetti';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { QuickShortenCard } from '../components/dashboard/QuickShortenCard';
import { YourLinksTable } from '../components/dashboard/YourLinksTable';
import { AlertBanner } from '../components/AlertBanner';
import { UrlSuccessModal } from '../components/url/UrlSuccessModal';
import { UrlEditModal } from '../components/url/UrlEditModal';
import { UrlAnalyticsModal } from '../components/url/UrlAnalyticsModal';
import { UrlPasswordModal } from '../components/url/UrlPasswordModal';
import { urlApi, getErrorMessage } from '../services/api';
import { ShortenResponse, UrlStatsResponse, TagSummary } from '../types/url';

const log = logger.withModule('LinksPage');
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const LinksPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  const initialSearch = searchParams.get('search') || '';
  const initialTag = searchParams.get('tag') || 'all';

  // State
  const [links, setLinks] = useState<UrlStatsResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [allUserTags, setAllUserTags] = useState<TagSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);

  // Quick shorten expand/collapse
  const [isQuickShortenOpen, setIsQuickShortenOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Global alert
  const [alert, setAlert] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // Modals state
  const [successModalData, setSuccessModalData] = useState<ShortenResponse | null>(null);
  const [editingUrl, setEditingUrl] = useState<UrlStatsResponse | null>(null);
  const [analyticsShortId, setAnalyticsShortId] = useState<string | null>(null);
  const [passwordModalShortId, setPasswordModalShortId] = useState<string | null>(null);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 1. Fetch tags from backend
  const fetchTags = useCallback(async () => {
    try {
      const data = await urlApi.getUserTags();
      setAllUserTags(data || []);
    } catch (err: unknown) {
      log.warn('Could not load user tags:', err);
    }
  }, []);

  // 2. Fetch user links from backend with pagination, search, and tag filters
  const fetchLinks = useCallback(
    async (
      search = searchQuery,
      tag = selectedTag,
      page = currentPage,
      size = pageSize
    ) => {
      setIsLoadingLinks(true);
      try {
        const tagFilter = tag !== 'all' ? tag : undefined;
        const data = await urlApi.getMyLinks(search, page - 1, size, tagFilter);
        setLinks(data.content || []);
        setTotalCount(data.totalElements ?? (data.content ? data.content.length : 0));
      } catch (err: unknown) {
        log.warn('Could not load links:', err);
      } finally {
        setIsLoadingLinks(false);
      }
    },
    [searchQuery, selectedTag, currentPage, pageSize]
  );

  useEffect(() => {
    fetchLinks();
    fetchTags();
  }, [fetchLinks, fetchTags]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
    fetchLinks(val, selectedTag, 1, pageSize);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLinks(searchQuery, selectedTag, 1, pageSize);
  };

  const handleTagChange = (newTag: string) => {
    setSelectedTag(newTag);
    setCurrentPage(1);
    fetchLinks(searchQuery, newTag, 1, pageSize);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchLinks(searchQuery, selectedTag, newPage, pageSize);
    const el = document.getElementById('your-links');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
    fetchLinks(searchQuery, selectedTag, 1, newSize);
  };

  const handleShorten = async (data: {
    longUrl: string;
    title?: string;
    customAlias?: string;
    password?: string;
    expiryDays?: number;
    tags?: string[];
  }) => {
    setAlert(null);
    let cleanUrl = data.longUrl.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    setIsCreating(true);

    try {
      const res = await urlApi.shorten({
        longUrl: cleanUrl,
        title: data.title,
        customAlias: data.customAlias,
        password: data.password,
        expiryDays: data.expiryDays,
        tags: data.tags,
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        log.debug('Confetti suppressed:', e);
      }

      setSuccessModalData(res);
      setAlert({
        type: 'success',
        message: 'Your short link has been created successfully!',
      });
      setIsQuickShortenOpen(false);

      // Refresh real data from backend - reset to page 1
      setCurrentPage(1);
      fetchLinks(searchQuery, selectedTag, 1, pageSize);
      fetchTags();
    } catch (err: unknown) {
      setAlert({
        type: 'error',
        message: getErrorMessage(err),
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUrl = async (shortId: string) => {
    try {
      await urlApi.deleteUrl(shortId);
      setAlert({
        type: 'success',
        message: `Short URL /${shortId} deleted successfully.`,
      });
      fetchTags();

      // If this was the only item on current page (and not page 1), move back one page
      const newPage = links.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      if (newPage !== currentPage) {
        setCurrentPage(newPage);
      }
      fetchLinks(searchQuery, selectedTag, newPage, pageSize);
    } catch (err: unknown) {
      setAlert({
        type: 'error',
        message: getErrorMessage(err),
      });
    }
  };

  const handleCopyLink = (shortId: string, customPath?: string) => {
    const displayPath = customPath || shortId;
    const full = `${API_BASE_URL}/${displayPath}`;
    navigator.clipboard.writeText(full);
    setCopiedId(shortId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleVisitLink = (item: UrlStatsResponse) => {
    if (item.passwordProtected) {
      setPasswordModalShortId(item.shortId);
    } else {
      window.open(item.longUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <DashboardLayout
      searchValue={searchQuery}
      onSearchChange={handleSearchChange}
      onSearchSubmit={handleSearchSubmit}
    >
      {/* Global alert notification */}
      {alert && (
        <AlertBanner
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Links
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50">
              {totalCount} {totalCount === 1 ? 'link' : 'links'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage, filter, and track performance of all your shortened URLs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsQuickShortenOpen((prev) => !prev)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-500/25 cursor-pointer self-start sm:self-auto"
        >
          {isQuickShortenOpen ? (
            <>
              <X className="w-4 h-4" />
              <span>Close Shortener</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Create Short Link</span>
            </>
          )}
        </button>
      </div>

      {/* Expandable Quick Shorten Box */}
      {isQuickShortenOpen && (
        <div className="animate-in fade-in slide-in-from-top-3 duration-200">
          <QuickShortenCard
            onShorten={handleShorten}
            isCreating={isCreating}
            availableTags={allUserTags.map((t) => t.tag)}
          />
        </div>
      )}

      {/* Your Links Table */}
      <YourLinksTable
        links={links}
        totalCount={totalCount}
        tags={allUserTags}
        search={searchQuery}
        onSearchChange={handleSearchChange}
        selectedTag={selectedTag}
        onSelectTag={handleTagChange}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={[10, 25, 50, 100]}
        isLoading={isLoadingLinks}
        onCopy={handleCopyLink}
        copiedId={copiedId}
        onAnalytics={(shortId) => setAnalyticsShortId(shortId)}
        onEdit={(url) => setEditingUrl(url)}
        onDelete={handleDeleteUrl}
        onVisit={handleVisitLink}
      />

      {/* Modals */}
      <UrlSuccessModal
        url={successModalData}
        isOpen={!!successModalData}
        onClose={() => setSuccessModalData(null)}
        onViewAnalytics={(shortId) => setAnalyticsShortId(shortId)}
      />

      <UrlEditModal
        url={editingUrl}
        isOpen={!!editingUrl}
        onClose={() => setEditingUrl(null)}
        onUpdated={() => {
          fetchLinks(searchQuery, selectedTag, currentPage, pageSize);
          fetchTags();
        }}
      />

      <UrlAnalyticsModal
        shortId={analyticsShortId}
        isOpen={!!analyticsShortId}
        onClose={() => setAnalyticsShortId(null)}
      />

      <UrlPasswordModal
        shortId={passwordModalShortId}
        isOpen={!!passwordModalShortId}
        onClose={() => setPasswordModalShortId(null)}
      />
    </DashboardLayout>
  );
};
