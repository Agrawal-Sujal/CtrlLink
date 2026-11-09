import React, { useState, useEffect, useCallback } from 'react';
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

  // Links & Tags state
  const [links, setLinks] = useState<UrlStatsResponse[]>([]);
  const [allUserTags, setAllUserTags] = useState<TagSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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

  const fetchTags = useCallback(async () => {
    try {
      const data = await urlApi.getUserTags();
      setAllUserTags(data || []);
    } catch (err: unknown) {
      log.warn('Could not load user tags:', err);
    }
  }, []);

  const fetchLinks = useCallback(
    async (search = searchQuery) => {
      try {
        const data = await urlApi.getMyLinks(search, 0, 100);
        setLinks(data.content || []);
      } catch (err: unknown) {
        log.warn('Could not load links:', err);
      }
    },
    [searchQuery]
  );

  useEffect(() => {
    fetchLinks();
    fetchTags();
  }, [fetchLinks, fetchTags]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLinks(searchQuery);
  };

  const handleShorten = async (data: {
    longUrl: string;
    customAlias?: string;
    password?: string;
    expiryDays?: number;
    tags?: string[];
    useAutoTitle: boolean;
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
        customAlias: data.customAlias,
        password: data.password,
        expiryDays: data.expiryDays,
        tags: data.tags,
        useAutoTitle: data.useAutoTitle,
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

  // Stats calculation
  const totalClicks = links.reduce((sum, u) => sum + (u.clickCount || 0), 0);
  const totalProtected = links.filter((u) => u.passwordProtected).length;
  const avgClicks =
    links.length > 0 ? (totalClicks / links.length).toFixed(1) : '0';

  return (
    <DashboardLayout
      searchValue={searchQuery}
      onSearchChange={(val) => {
        setSearchQuery(val);
        fetchLinks(val);
      }}
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
        userName={user?.name || 'Sujal Agrawal'}
        totalLinks={links.length}
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

      {/* 3. Middle Two-Column Grid: Clicks by Short URL & Click Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClicksByShortUrlCard
          urls={links}
          onSelectUrl={(shortId) => setAnalyticsShortId(shortId)}
          onViewAll={() => {
            const el = document.getElementById('your-links');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        <ClickTimelineCard urls={links} />
      </div>

      {/* 4. Your Links Table */}
      <YourLinksTable
        links={links}
        tags={allUserTags}
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
