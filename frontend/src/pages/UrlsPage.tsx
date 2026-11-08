import React, { useState, useEffect } from 'react';
import { logger } from '../utils/logger';

const log = logger.withModule('UrlsPage');
import {
  Link2,
  Plus,
  Search,
  Copy,
  Check,
  ExternalLink,
  BarChart3,
  Calendar,
  Lock,
  Tag,
  Trash2,
  Edit3,
  MousePointerClick,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Eye,
  ClipboardPaste,
  Sparkles,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { AlertBanner } from '../components/AlertBanner';
import { UrlBarChart } from '../components/url/UrlBarChart';
import { UrlSuccessModal } from '../components/url/UrlSuccessModal';
import { UrlEditModal } from '../components/url/UrlEditModal';
import { UrlAnalyticsModal } from '../components/url/UrlAnalyticsModal';
import { UrlPasswordModal } from '../components/url/UrlPasswordModal';
import { urlApi, getErrorMessage } from '../services/api';
import { ShortenResponse, UrlStatsResponse } from '../types/url';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const UrlsPage: React.FC = () => {
  // Links state
  const [links, setLinks] = useState<UrlStatsResponse[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'public' | 'protected'>('all');
  const [alert, setAlert] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // Creation form state
  const [isCreating, setIsCreating] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [longUrl, setLongUrl] = useState('');
  const [title, setTitle] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiryDays, setExpiryDays] = useState<number | undefined>(undefined);
  const [password, setPassword] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [useAutoTitle, setUseAutoTitle] = useState(false);

  // Modals state
  const [successModalData, setSuccessModalData] = useState<ShortenResponse | null>(null);
  const [editingUrl, setEditingUrl] = useState<UrlStatsResponse | null>(null);
  const [analyticsShortId, setAnalyticsShortId] = useState<string | null>(null);
  const [passwordModalShortId, setPasswordModalShortId] = useState<string | null>(null);

  // Copy feedback tracking
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async (search = searchQuery) => {
    setIsLoadingLinks(true);
    try {
      const data = await urlApi.getMyLinks(search);
      setLinks(data.content || []);
    } catch (err: unknown) {
      log.warn('Could not load links:', err);
    } finally {
      setIsLoadingLinks(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLinks(searchQuery);
  };

  const handlePasteClipboard = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setLongUrl(clipText.trim());
      }
    } catch {
      // Ignore if permission denied
    }
  };

  const handleAddTag = () => {
    const clean = tagInput.trim().toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleCreateShortUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    let cleanUrl = longUrl.trim();
    if (!cleanUrl) {
      setAlert({ type: 'error', message: 'Please paste a destination URL.' });
      return;
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    setIsCreating(true);

    try {
      const res = await urlApi.shorten({
        longUrl: cleanUrl,
        title: title.trim() || undefined,
        customAlias: customAlias.trim() || undefined,
        expiryDays: expiryDays ? Number(expiryDays) : undefined,
        password: password.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        useAutoTitle,
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 110,
          spread: 75,
          origin: { y: 0.6 },
        });
      } catch {}

      // Reset form
      setLongUrl('');
      setTitle('');
      setCustomAlias('');
      setExpiryDays(undefined);
      setPassword('');
      setTags([]);
      setShowOptions(false);

      // Open Success Dialog
      setSuccessModalData(res);

      setAlert({
        type: 'success',
        message: 'Your short URL has been generated successfully!',
      });

      fetchLinks();
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
    if (!window.confirm(`Are you sure you want to delete short link /${shortId}?`)) {
      return;
    }

    try {
      await urlApi.deleteUrl(shortId);
      setLinks((prev) => prev.filter((u) => u.shortId !== shortId));
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

  const handleCopyLink = (shortId: string, shortUrl?: string) => {
    const full =
      shortUrl && !shortUrl.includes('/r/')
        ? shortUrl
        : `${API_BASE_URL}/${shortId}`;
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

  // Helper to extract hostname for favicon
  const getDomainFromUrl = (urlString: string) => {
    try {
      return new URL(urlString).hostname;
    } catch {
      return '';
    }
  };

  // Stats calculation
  const totalClicks = links.reduce((sum, u) => sum + (u.clickCount || 0), 0);
  const totalProtected = links.filter((u) => u.passwordProtected).length;
  const avgClicks = links.length > 0 ? (totalClicks / links.length).toFixed(1) : '0';

  // Filter links
  const filteredLinks = links.filter((link) => {
    if (statusFilter === 'public') return !link.passwordProtected;
    if (statusFilter === 'protected') return link.passwordProtected;
    return true;
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors duration-200 relative overflow-hidden">
      {/* Ambient Top Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[250px] bg-indigo-500/10 dark:bg-indigo-600/15 blur-[120px] pointer-events-none" />

      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Global Notification */}
        {alert && (
          <AlertBanner
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3 pt-2 pb-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Next-Gen Link Shortener &amp; Real-Time Analytics</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight bg-linear-to-r from-zinc-900 via-indigo-950 to-zinc-800 dark:from-white dark:via-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
            Shorten Links, Expand Your Reach
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Create ultra-fast short URLs, protect sensitive links with passwords, set expiry dates, and analyze click telemetry in real-time.
          </p>
        </div>

        {/* 1. Unified Hero Shortener Box (Dub style) */}
        <div className="w-full max-w-4xl mx-auto rounded-3xl bg-white dark:bg-[#121215] border border-zinc-200/90 dark:border-white/[0.08] shadow-xl dark:shadow-indigo-950/10 p-4 sm:p-6 space-y-4">
          <form onSubmit={handleCreateShortUrl} className="space-y-4">
            {/* Input Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 p-1.5 rounded-2xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-white/[0.08] focus-within:border-indigo-500 dark:focus-within:border-indigo-400 transition-colors">
              <div className="flex items-center gap-2 w-full px-3 py-1.5 sm:py-0">
                <Link2 className="w-5 h-5 text-zinc-400 dark:text-zinc-500 -rotate-45 shrink-0" />
                <input
                  type="url"
                  placeholder="Paste long link here (e.g. https://example.com/very/long/path)..."
                  value={longUrl}
                  onChange={(e) => setLongUrl(e.target.value)}
                  className="w-full text-sm sm:text-base font-medium bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-hidden py-1.5"
                  required
                />
                {!longUrl && (
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                    title="Paste from clipboard"
                  >
                    <ClipboardPaste className="w-3 h-3" />
                    <span>Paste</span>
                  </button>
                )}
              </div>

              <div className="w-full sm:w-auto shrink-0 flex items-center justify-end px-1 pb-1 sm:p-0">
                <Button
                  type="submit"
                  size="md"
                  isLoading={isCreating}
                  leftIcon={<Plus className="w-4 h-4" />}
                  className="w-full sm:w-auto"
                >
                  Shorten Link
                </Button>
              </div>
            </div>

            {/* Quick Pills Row for options */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowOptions(!showOptions)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    showOptions
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'border-zinc-200 dark:border-white/[0.08] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-850'
                  }`}
                >
                  <span>Link Options</span>
                  {(customAlias || password || expiryDays || tags.length > 0 || title) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  )}
                  {showOptions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {/* Direct quick badges */}
                {customAlias && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-mono border border-indigo-500/20">
                    alias: /{customAlias}
                  </span>
                )}
                {password && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-semibold border border-amber-500/20">
                    <Lock className="w-3 h-3" /> Protected
                  </span>
                )}
                {expiryDays && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[11px] font-semibold border border-cyan-500/20">
                    <Clock className="w-3 h-3" /> {expiryDays}d Expiry
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="smart-title-toggle"
                  type="checkbox"
                  checked={useAutoTitle}
                  onChange={(e) => setUseAutoTitle(e.target.checked)}
                  className="w-3.5 h-3.5 rounded-sm text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="smart-title-toggle" className="text-zinc-500 dark:text-zinc-400 cursor-pointer select-none">
                  Smart AI Title Fetch
                </label>
              </div>
            </div>

            {/* Expandable Advanced Options Drawer */}
            {showOptions && (
              <div className="pt-4 border-t border-zinc-100 dark:border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-200">
                <Input
                  label="Title (Optional)"
                  type="text"
                  placeholder="e.g. Portfolio Website"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  helperText="Human readable description"
                />

                <Input
                  label="Custom Alias"
                  type="text"
                  placeholder="e.g. summer-launch"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  helperText="3-20 lowercase alphanumeric characters"
                />

                <Input
                  label="Password Protection"
                  isPassword
                  placeholder="Optional access password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  helperText="Visitors must enter password to redirect"
                />

                <div className="space-y-1.5 text-left">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Auto-Expiry
                  </label>
                  <select
                    value={expiryDays || ''}
                    onChange={(e) => setExpiryDays(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full rounded-xl text-sm py-2.5 px-3 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/[0.1] text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 outline-hidden cursor-pointer"
                  >
                    <option value="">Never (Permanent Link)</option>
                    <option value="1">1 Day</option>
                    <option value="7">7 Days</option>
                    <option value="30">30 Days</option>
                    <option value="90">90 Days</option>
                    <option value="365">1 Year (365 Days)</option>
                  </select>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Link deactivates automatically after period</p>
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Tags &amp; Categorization
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Add tag (e.g. twitter, github, doc)"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="flex-1 rounded-xl text-xs sm:text-sm py-2 px-3 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/[0.1] focus:border-indigo-500 outline-hidden"
                    />
                    <Button type="button" size="sm" variant="secondary" onClick={handleAddTag}>
                      Add Tag
                    </Button>
                  </div>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 text-xs font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg border border-indigo-500/20"
                        >
                          <Tag className="w-3 h-3" />
                          <span>{t}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(t)}
                            className="p-0.5 rounded-full hover:bg-indigo-500/20 cursor-pointer"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* 2. Quick Overview Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl p-4 bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-white/[0.08] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
              <span>Total Links</span>
              <Layers className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">
              {links.length}
            </p>
          </div>

          <div className="rounded-2xl p-4 bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-white/[0.08] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
              <span>Total Clicks</span>
              <MousePointerClick className="w-4 h-4 text-cyan-500" />
            </div>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">
              {totalClicks.toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl p-4 bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-white/[0.08] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
              <span>Protected Links</span>
              <Lock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">
              {totalProtected}
            </p>
          </div>

          <div className="rounded-2xl p-4 bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-white/[0.08] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
              <span>Avg Clicks / Link</span>
              <BarChart3 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">
              {avgClicks}
            </p>
          </div>
        </div>

        {/* 3. Clicks by Short URL Bar Chart (x-axis: short URLs, y-axis: clicks) */}
        {links.length > 0 && (
          <UrlBarChart
            urls={links}
            onSelectUrl={(shortId) => setAnalyticsShortId(shortId)}
          />
        )}

        {/* 4. Links Table & Search */}
        <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-white/[0.08] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-white/[0.06] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Your Shortened Links</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {links.length} link{links.length !== 1 ? 's' : ''} total &bull; {totalClicks.toLocaleString()} total clicks &bull; {totalProtected} protected
                </p>
              </div>
            </div>

            {/* Filter Pills & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-white/[0.08] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  All ({links.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('public')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'public'
                      ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Public
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('protected')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === 'protected'
                      ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Protected ({totalProtected})
                </button>
              </div>

              {/* Search Input */}
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-60">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search links, tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl text-xs sm:text-sm pl-9 pr-3 py-2 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-white/[0.08] focus:border-indigo-500 outline-hidden"
                  />
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => fetchLinks()} title="Refresh list">
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLinks ? 'animate-spin' : ''}`} />
                </Button>
              </form>
            </div>
          </div>

          {/* Links List Table */}
          {isLoadingLinks ? (
            <div className="py-16 text-center text-zinc-500 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
              Loading your shortened URLs...
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="py-16 text-center text-zinc-400 space-y-2">
              <Link2 className="w-10 h-10 mx-auto opacity-30 text-indigo-500 -rotate-45" />
              <p className="font-semibold text-zinc-700 dark:text-zinc-300">No short links found</p>
              <p className="text-xs">Create your first link using the shorten box above!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-white/[0.06] text-zinc-400 uppercase text-[11px] font-semibold tracking-wider">
                    <th className="pb-3 pr-4">Link Details</th>
                    <th className="pb-3 px-4">Clicks</th>
                    <th className="pb-3 px-4">Tags &amp; Security</th>
                    <th className="pb-3 px-4">Created</th>
                    <th className="pb-3 pl-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.04]">
                  {filteredLinks.map((link) => {
                    const domain = getDomainFromUrl(link.longUrl);
                    return (
                      <tr
                        key={link.shortId}
                        className="group hover:bg-zinc-50/80 dark:hover:bg-[#18181b]/80 transition-colors"
                      >
                        {/* 1. Title, Domain Favicon & Short URL */}
                        <td className="py-4 pr-4 max-w-[280px]">
                          <div className="flex items-start gap-3">
                            {/* Domain Favicon */}
                            <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
                              {domain ? (
                                <img
                                  src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                                  alt={domain}
                                  className="w-4 h-4 object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <Link2 className="w-4 h-4 text-zinc-400" />
                              )}
                            </div>

                            <div className="space-y-1 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => handleVisitLink(link)}
                                className="font-bold text-zinc-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate block text-left w-full cursor-pointer"
                                title="Open destination URL"
                              >
                                {link.title || `/${link.shortId}`}
                              </button>

                              <div className="flex items-center gap-1.5 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                                <button
                                  type="button"
                                  onClick={() => handleVisitLink(link)}
                                  className="truncate hover:underline text-left cursor-pointer"
                                  title="Click to visit destination"
                                >
                                  /{link.shortId}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopyLink(link.shortId)}
                                  className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-indigo-500 cursor-pointer"
                                  title="Copy short link"
                                >
                                  {copiedId === link.shortId ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>

                              <a
                                href={link.longUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 truncate block hover:underline"
                                title={link.longUrl}
                              >
                                {link.longUrl}
                              </a>
                            </div>
                          </div>
                        </td>

                        {/* 2. Clicks count */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setAnalyticsShortId(link.shortId)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors cursor-pointer"
                            title="Click to view full analytics"
                          >
                            <MousePointerClick className="w-3.5 h-3.5 text-cyan-500" />
                            <span>{link.clickCount.toLocaleString()} clicks</span>
                          </button>
                        </td>

                        {/* 3. Tags & Protection */}
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap items-center gap-1.5 max-w-[180px]">
                            {link.passwordProtected ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                <Lock className="w-2.5 h-2.5" /> Password
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                                Public
                              </span>
                            )}

                            {link.tags &&
                              link.tags.slice(0, 3).map((t) => (
                                <span
                                  key={t}
                                  className="text-[10px] text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md border border-zinc-200 dark:border-white/[0.08]"
                                >
                                  #{t}
                                </span>
                              ))}
                          </div>
                        </td>

                        {/* 4. Date option leading to analytics */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setAnalyticsShortId(link.shortId)}
                            className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors cursor-pointer"
                            title="Click on date to view analytics"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {link.createdAt
                                ? new Date(link.createdAt).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : '—'}
                            </span>
                          </button>
                          {link.lastAccessedTime && (
                            <p className="text-[10px] text-zinc-400 mt-0.5">
                              Last: {new Date(link.lastAccessedTime).toLocaleDateString()}
                            </p>
                          )}
                        </td>

                        {/* 5. Actions: Show URL, Analytics, Edit, Delete, Visit */}
                        <td className="py-4 pl-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Show URL Pop-up */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setSuccessModalData({
                                  shortId: link.shortId,
                                  shortUrl: `${API_BASE_URL}/${link.shortId}`,
                                  longUrl: link.longUrl,
                                  createdAt: link.createdAt,
                                  title: link.title,
                                  passwordProtected: link.passwordProtected,
                                  tags: link.tags,
                                })
                              }
                              leftIcon={<Eye className="w-3.5 h-3.5" />}
                              title="Show URL Details & QR Code"
                            >
                              Show URL
                            </Button>

                            {/* Analytics Button */}
                            <button
                              type="button"
                              onClick={() => setAnalyticsShortId(link.shortId)}
                              className="p-2 rounded-xl text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              title="View Click Analytics"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </button>

                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => setEditingUrl(link)}
                              className="p-2 rounded-xl text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              title="Edit Title & Tags"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Visit Link */}
                            <button
                              type="button"
                              onClick={() => handleVisitLink(link)}
                              className="p-2 rounded-xl text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              title="Open Link Destination"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteUrl(link.shortId)}
                              className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete Short URL"
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
          )}
        </div>
      </main>

      {/* Pop-up: Show URL Dialog Box (with QR Code) */}
      <UrlSuccessModal
        url={successModalData}
        isOpen={!!successModalData}
        onClose={() => setSuccessModalData(null)}
        onViewAnalytics={(shortId) => setAnalyticsShortId(shortId)}
      />

      {/* Pop-up: Edit Link Dialog Box */}
      <UrlEditModal
        url={editingUrl}
        isOpen={!!editingUrl}
        onClose={() => setEditingUrl(null)}
        onUpdated={() => fetchLinks()}
      />

      {/* Pop-up: Deep Click Analytics Dialog Box */}
      <UrlAnalyticsModal
        shortId={analyticsShortId}
        isOpen={!!analyticsShortId}
        onClose={() => setAnalyticsShortId(null)}
      />

      {/* Pop-up: In-App Password Challenge Dialog Box */}
      <UrlPasswordModal
        shortId={passwordModalShortId}
        isOpen={!!passwordModalShortId}
        onClose={() => setPasswordModalShortId(null)}
      />
    </div>
  );
};
