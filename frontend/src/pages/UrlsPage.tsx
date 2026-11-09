import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '../utils/logger';
import confetti from 'canvas-confetti';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { StatCardsRow } from '../components/dashboard/StatCardsRow';
import { QuickShortenCard } from '../components/dashboard/QuickShortenCard';
import { ClicksByShortUrlCard } from '../components/dashboard/ClicksByShortUrlCard';
import { ClickTimelineCard } from '../components/dashboard/ClickTimelineCard';
import { YourLinksTable } from '../components/dashboard/YourLinksTable';
import { AlertBanner } from '../components/AlertBanner';
import { UrlSuccessModal } from '../components/url/UrlSuccessModal';
import { UrlEditModal } from '../components/url/UrlEditModal';
import { UrlAnalyticsModal } from '../components/url/UrlAnalyticsModal';
import { UrlPasswordModal } from '../components/url/UrlPasswordModal';
import { urlApi, getErrorMessage } from '../services/api';
import { ShortenResponse, UrlStatsResponse, TagSummary } from '../types/url';
import { useAuth } from '../context/AuthContext';

const log = logger.withModule('UrlsPage');
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const UrlsPage: React.FC = () => {
  const { user } = useAuth();

  // Links & Tags state strictly from backend
  const [links, setLinks] = useState<UrlStatsResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [allUserTags, setAllUserTags] = useState<TagSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const pageSize = 10;

  // Timeline analytics state from backend
  const [timelineRange, setTimelineRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [timeSeriesData, setTimeSeriesData] = useState<Record<string, number>>({});
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);

  // Global alert
  const [alert, setAlert] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // Shorten submission loading state
  const [isCreating, setIsCreating] = useState(false);

  // Modals state
  const [successModalData, setSuccessModalData] = useState<ShortenResponse | null>(null);
  const [editingUrl, setEditingUrl] = useState<UrlStatsResponse | null>(null);
  const [analyticsShortId, setAnalyticsShortId] = useState<string | null>(null);
  const [passwordModalShortId, setPasswordModalShortId] = useState<string | null>(null);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 1. Fetch user tags from backend
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
      page = currentPage
    ) => {
      setIsLoadingLinks(true);
      try {
        const tagFilter = tag !== 'all' ? tag : undefined;
        const data = await urlApi.getMyLinks(search, page - 1, pageSize, tagFilter);
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

  // 3. Fetch real timeline analytics from backend if links exist
  const fetchTimelineData = useCallback(
    async (currentLinks: UrlStatsResponse[], range: '7d' | '30d' | '90d') => {
      const activeLinks = currentLinks.filter((l) => (l.clickCount || 0) > 0);
      if (activeLinks.length === 0) {
        setTimeSeriesData({});
        return;
      }

      setIsLoadingTimeline(true);
      try {
        const statsPromises = activeLinks.slice(0, 15).map((l) =>
          urlApi.getStats(l.shortId, range === '90d' ? 'all' : range)
        );

        const results = await Promise.allSettled(statsPromises);
        const aggregated: Record<string, number> = {};

        results.forEach((res) => {
          if (res.status === 'fulfilled' && res.value?.timeSeries) {
            Object.entries(res.value.timeSeries).forEach(([dateStr, count]) => {
              aggregated[dateStr] = (aggregated[dateStr] || 0) + Number(count);
            });
          }
        });

        setTimeSeriesData(aggregated);
      } catch (err: unknown) {
        log.warn('Could not load click timeline data:', err);
      } finally {
        setIsLoadingTimeline(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchLinks();
    fetchTags();
  }, [fetchLinks, fetchTags]);

  useEffect(() => {
    fetchTimelineData(links, timelineRange);
  }, [links, timelineRange, fetchTimelineData]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
    fetchLinks(val, selectedTag, 1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLinks(searchQuery, selectedTag, 1);
  };

  const handleTagChange = (newTag: string) => {
    setSelectedTag(newTag);
    setCurrentPage(1);
    fetchLinks(searchQuery, newTag, 1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchLinks(searchQuery, selectedTag, newPage);
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

      // Refresh real data from backend
      fetchLinks();
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
      setLinks((prev) => prev.filter((u) => u.shortId !== shortId));
      setTotalCount((c) => Math.max(c - 1, 0));
      fetchTags();
      setAlert({
        type: 'success',
        message: `Short URL /${shortId} deleted successfully.`,
      });
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

  // Real Stats calculation strictly from backend data
  const totalClicks = links.reduce((sum, u) => sum + (u.clickCount || 0), 0);
  const totalProtected = links.filter((u) => u.passwordProtected).length;
  const avgClicks =
    totalCount > 0 ? (totalClicks / totalCount).toFixed(1) : '0';

  // Only show click timeline if genuine data exists from backend
  const hasTimelineData = useMemo(() => {
    return Object.values(timeSeriesData).some((clicks) => clicks > 0);
  }, [timeSeriesData]);

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

      {/* 1. Header greeting & 4 Metric Cards (percentage increases removed) */}
      <StatCardsRow
        userName={user?.name || user?.email?.split('@')[0] || 'User'}
        totalLinks={totalCount}
        totalClicks={totalClicks}
        totalProtected={totalProtected}
        avgClicks={avgClicks}
      />

      {/* 2. Quick Shorten Box (Add Title included, no default tags, AI title toggle removed) */}
      <QuickShortenCard
        onShorten={handleShorten}
        isCreating={isCreating}
        availableTags={allUserTags.map((t) => t.tag)}
      />

      {/* 3. Middle Section: Clicks by Short URL & Click Timeline (only if real data exists) */}
      {links.length > 0 && (
        <div
          className={`grid gap-6 ${
            hasTimelineData ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
          }`}
        >
          <ClicksByShortUrlCard
            urls={links}
            onSelectUrl={(shortId) => setAnalyticsShortId(shortId)}
            onViewAll={() => {
              const el = document.getElementById('your-links');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          {hasTimelineData && (
            <ClickTimelineCard
              timeSeriesData={timeSeriesData}
              range={timelineRange}
              onRangeChange={setTimelineRange}
              isLoading={isLoadingTimeline}
            />
          )}
        </div>
      )}

      {/* 4. Your Links Table (with destination link & pagination decided strictly on total links) */}
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
          fetchLinks();
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
