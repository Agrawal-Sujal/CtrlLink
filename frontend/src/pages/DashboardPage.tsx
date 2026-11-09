import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';
import confetti from 'canvas-confetti';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { StatCardsRow } from '../components/dashboard/StatCardsRow';
import { QuickShortenCard } from '../components/dashboard/QuickShortenCard';
import { ClicksByShortUrlCard } from '../components/dashboard/ClicksByShortUrlCard';
import { ClickTimelineCard } from '../components/dashboard/ClickTimelineCard';
import { AlertBanner } from '../components/AlertBanner';
import { UrlSuccessModal } from '../components/url/UrlSuccessModal';
import { UrlAnalyticsModal } from '../components/url/UrlAnalyticsModal';
import { urlApi, getErrorMessage } from '../services/api';
import { ShortenResponse, UrlStatsResponse, TagSummary } from '../types/url';
import { useAuth } from '../context/AuthContext';

const log = logger.withModule('DashboardPage');

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Links & Tags state from backend for dashboard stats & charts
  const [links, setLinks] = useState<UrlStatsResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [allUserTags, setAllUserTags] = useState<TagSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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
  const [analyticsShortId, setAnalyticsShortId] = useState<string | null>(null);

  // 1. Fetch user tags from backend
  const fetchTags = useCallback(async () => {
    try {
      const data = await urlApi.getUserTags();
      setAllUserTags(data || []);
    } catch (err: unknown) {
      log.warn('Could not load user tags:', err);
    }
  }, []);

  // 2. Fetch user links from backend for stats & charts
  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch up to 1000 user links to compute accurate aggregates & top URLs
      const data = await urlApi.getMyLinks('', 0, 1000);
      setLinks(data.content || []);
      const total =
        data.totalElements ??
        data.page?.totalElements ??
        (data.content ? data.content.length : 0);
      setTotalCount(total);
    } catch (err: unknown) {
      log.warn('Could not load dashboard links:', err);
    }
  }, []);

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
    fetchDashboardData();
    fetchTags();
  }, [fetchDashboardData, fetchTags]);

  useEffect(() => {
    fetchTimelineData(links, timelineRange);
  }, [links, timelineRange, fetchTimelineData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/links?search=${encodeURIComponent(searchQuery.trim())}`);
    }
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
      fetchDashboardData();
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
      onSearchChange={setSearchQuery}
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

      {/* 1. Header greeting & 4 Metric Cards */}
      <StatCardsRow
        userName={user?.name || user?.email?.split('@')[0] || 'User'}
        totalLinks={totalCount}
        totalClicks={totalClicks}
        totalProtected={totalProtected}
        avgClicks={avgClicks}
      />

      {/* 2. Quick Shorten Box */}
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
            onViewAll={() => navigate('/links')}
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

      {/* Modals */}
      <UrlSuccessModal
        url={successModalData}
        isOpen={!!successModalData}
        onClose={() => setSuccessModalData(null)}
        onViewAnalytics={(shortId) => setAnalyticsShortId(shortId)}
      />

      <UrlAnalyticsModal
        shortId={analyticsShortId}
        isOpen={!!analyticsShortId}
        onClose={() => setAnalyticsShortId(null)}
      />
    </DashboardLayout>
  );
};
