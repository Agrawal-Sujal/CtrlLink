import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Tag,
  Link2,
  Copy,
  Check,
  ExternalLink,
  Search,
  MousePointerClick,
  Layers,
  Sparkles,
  RefreshCw,
  Plus,
  Lock,
  Calendar,
  Edit3,
  Trash2,
  FolderOpen,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/Button';
import { AlertBanner } from '../components/AlertBanner';
import { UrlEditModal } from '../components/url/UrlEditModal';
import { UrlAnalyticsModal } from '../components/url/UrlAnalyticsModal';
import { UrlPasswordModal } from '../components/url/UrlPasswordModal';
import { urlApi, getErrorMessage } from '../services/api';
import { UrlStatsResponse, TagSummary } from '../types/url';
import { logger } from '../utils/logger';

const log = logger.withModule('TagsPage');
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const TagsPage: React.FC = () => {
  const [tags, setTags] = useState<TagSummary[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [links, setLinks] = useState<UrlStatsResponse[]>([]);
  const [allLinks, setAllLinks] = useState<UrlStatsResponse[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [urlSearch, setUrlSearch] = useState('');
  const [sortBy, setSortBy] = useState<'count' | 'alpha'>('count');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Quick tag creator
  const [newTagName, setNewTagName] = useState('');
  const [selectedUrlForNewTag, setSelectedUrlForNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Modals
  const [editingUrl, setEditingUrl] = useState<UrlStatsResponse | null>(null);
  const [analyticsShortId, setAnalyticsShortId] = useState<string | null>(null);
  const [passwordModalShortId, setPasswordModalShortId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // Load all tags & links
  const fetchTagsAndAllLinks = useCallback(async () => {
    setIsLoadingTags(true);
    try {
      const [tagsData, linksData] = await Promise.all([
        urlApi.getUserTags(),
        urlApi.getMyLinks('', 0, 200),
      ]);
      setTags(tagsData || []);
      setAllLinks(linksData.content || []);

      // If no tag is selected and tags exist, select the first one by default
      if (!selectedTag && tagsData && tagsData.length > 0) {
        setSelectedTag(tagsData[0].tag);
      }
    } catch (err: unknown) {
      log.warn('Could not load tags or links:', err);
    } finally {
      setIsLoadingTags(false);
    }
  }, [selectedTag]);

  // Load links for currently selected tag
  const fetchTaggedLinks = useCallback(async (tag: string) => {
    setIsLoadingLinks(true);
    try {
      const data = await urlApi.getMyLinks('', 0, 100, tag);
      setLinks(data.content || []);
    } catch (err: unknown) {
      log.warn(`Could not load links for tag ${tag}:`, err);
    } finally {
      setIsLoadingLinks(false);
    }
  }, []);

  useEffect(() => {
    fetchTagsAndAllLinks();
  }, [fetchTagsAndAllLinks]);

  useEffect(() => {
    if (selectedTag) {
      fetchTaggedLinks(selectedTag);
    } else {
      setLinks([]);
    }
  }, [selectedTag, fetchTaggedLinks]);

  // Helper to extract domain for favicons
  const getDomainFromUrl = (urlString: string) => {
    try {
      return new URL(urlString).hostname;
    } catch {
      return '';
    }
  };

  const handleCopyLink = (shortId: string, customPath?: string) => {
    const full = `${API_BASE_URL}/${customPath || shortId}`;
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

  const handleDeleteUrl = async (shortId: string) => {
    if (!window.confirm(`Are you sure you want to delete short link /${shortId}?`)) {
      return;
    }
    try {
      await urlApi.deleteUrl(shortId);
      setLinks((prev) => prev.filter((u) => u.shortId !== shortId));
      setAllLinks((prev) => prev.filter((u) => u.shortId !== shortId));
      setAlert({
        type: 'success',
        message: `Short URL /${shortId} deleted successfully.`,
      });
      fetchTagsAndAllLinks();
    } catch (err: unknown) {
      setAlert({
        type: 'error',
        message: getErrorMessage(err),
      });
    }
  };

  // Quick tag creation & attachment to an existing link
  const handleCreateAndAssignTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTag = newTagName.trim().toLowerCase();
    if (!cleanTag) return;

    if (!selectedUrlForNewTag) {
      setAlert({
        type: 'warning',
        message: 'Please choose a link to attach this tag to, or create a tagged link from the dashboard.',
      });
      return;
    }

    setIsAddingTag(true);
    setAlert(null);
    try {
      const targetLink = allLinks.find((l) => l.shortId === selectedUrlForNewTag);
      const existingTags = targetLink?.tags ? Array.from(targetLink.tags) : [];
      if (!existingTags.includes(cleanTag)) {
        existingTags.push(cleanTag);
      }

      await urlApi.updateTags(selectedUrlForNewTag, existingTags);
      setAlert({
        type: 'success',
        message: `Tag #${cleanTag} added to link /${selectedUrlForNewTag}!`,
      });
      setNewTagName('');
      setSelectedUrlForNewTag('');
      setSelectedTag(cleanTag);
      await fetchTagsAndAllLinks();
      fetchTaggedLinks(cleanTag);
    } catch (err: unknown) {
      setAlert({
        type: 'error',
        message: getErrorMessage(err),
      });
    } finally {
      setIsAddingTag(false);
    }
  };

  // Filter and sort tags
  const filteredTags = useMemo(() => {
    const clean = tagSearch.trim().toLowerCase();
    let result = tags.filter((t) => (clean ? t.tag.toLowerCase().includes(clean) : true));
    if (sortBy === 'count') {
      result = [...result].sort((a, b) => b.count - a.count);
    } else {
      result = [...result].sort((a, b) => a.tag.localeCompare(b.tag));
    }
    return result;
  }, [tags, tagSearch, sortBy]);

  // Filter URLs inside currently active tag
  const filteredLinks = useMemo(() => {
    const clean = urlSearch.trim().toLowerCase();
    if (!clean) return links;
    return links.filter(
      (l) =>
        l.shortId.toLowerCase().includes(clean) ||
        (l.title && l.title.toLowerCase().includes(clean)) ||
        l.longUrl.toLowerCase().includes(clean)
    );
  }, [links, urlSearch]);

  // Statistics
  const totalTaggedUrls = tags.reduce((sum, t) => sum + t.count, 0);
  const topTag = tags.length > 0 ? [...tags].sort((a, b) => b.count - a.count)[0] : null;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {alert && (
          <AlertBanner
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Page Hero */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Tags &amp; Categorization Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
              Tag Collections &amp; URL Explorer
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
              Browse, filter, and organize your shortened links by custom tags. Click any tag to see its matching URLs instantly.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="outline" size="sm" leftIcon={<Link2 className="w-4 h-4 -rotate-45" />}>
                Back to Links
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl p-4 bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-white/[0.08] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
              <span>Total Tags</span>
              <Tag className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">
              {tags.length}
            </p>
          </div>

          <div className="rounded-2xl p-4 bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-white/[0.08] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
              <span>Tagged Links</span>
              <Layers className="w-4 h-4 text-cyan-500" />
            </div>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">
              {totalTaggedUrls}
            </p>
          </div>

          <div className="rounded-2xl p-4 bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-white/[0.08] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
              <span>Top Tag</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-lg sm:text-xl font-bold truncate text-zinc-900 dark:text-white">
              {topTag ? `#${topTag.tag}` : '—'}
            </p>
          </div>

          <div className="rounded-2xl p-4 bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-white/[0.08] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
              <span>All Short Links</span>
              <MousePointerClick className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">
              {allLinks.length}
            </p>
          </div>
        </div>

        {/* Quick Assign / Create Tag Drawer */}
        <div className="rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-white/[0.08] p-4 sm:p-5 shadow-xs">
          <form onSubmit={handleCreateAndAssignTag} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                Add Tag to Link:
              </span>
            </div>

            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter tag name (e.g. social, docs, client)..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="w-full rounded-xl text-xs sm:text-sm py-2 px-3 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-white/[0.08] focus:border-indigo-500 outline-hidden"
              />
            </div>

            <div className="sm:w-64">
              <select
                value={selectedUrlForNewTag}
                onChange={(e) => setSelectedUrlForNewTag(e.target.value)}
                className="w-full rounded-xl text-xs sm:text-sm py-2 px-3 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-white/[0.08] focus:border-indigo-500 outline-hidden cursor-pointer text-zinc-900 dark:text-zinc-100"
              >
                <option value="">Select link to tag...</option>
                {allLinks.map((link) => (
                  <option key={link.shortId} value={link.shortId}>
                    /{link.shortId} {link.title ? `(${link.title})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              size="sm"
              isLoading={isAddingTag}
              disabled={!newTagName.trim() || !selectedUrlForNewTag}
              className="shrink-0"
            >
              Tag Link
            </Button>
          </form>
        </div>

        {/* Master-Detail Layout: Tags on Left, URLs on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Tags List (4 cols) */}
          <div className="lg:col-span-4 rounded-3xl bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-white/[0.08] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-500" />
                <h2 className="text-sm font-bold">All Tags ({filteredTags.length})</h2>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500">
                <button
                  type="button"
                  onClick={() => setSortBy('count')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    sortBy === 'count' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold' : 'hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Count
                </button>
                <span>&bull;</span>
                <button
                  type="button"
                  onClick={() => setSortBy('alpha')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    sortBy === 'alpha' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold' : 'hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  A-Z
                </button>
              </div>
            </div>

            {/* Tag Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search tags..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="w-full rounded-xl text-xs pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-white/[0.08] focus:border-indigo-500 outline-hidden"
              />
            </div>

            {/* Tag Badges List */}
            {isLoadingTags ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-indigo-500" />
                Loading tags...
              </div>
            ) : filteredTags.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400 space-y-1.5">
                <Tag className="w-6 h-6 mx-auto opacity-30 text-indigo-500" />
                <p className="font-semibold text-zinc-600 dark:text-zinc-300">No tags found</p>
                <p className="text-[11px]">Tag your short URLs using the box above!</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredTags.map((item) => {
                  const isSelected = selectedTag === item.tag;
                  return (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => setSelectedTag(item.tag)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer group ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                          : 'bg-zinc-50 dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border-zinc-200/70 dark:border-white/[0.06] text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Tag
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isSelected ? 'text-white' : 'text-indigo-500 group-hover:scale-110'
                          }`}
                        />
                        <span className="font-bold text-xs truncate">#{item.tag}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-mono px-2 py-0.5 rounded-lg ${
                            isSelected
                              ? 'bg-white/20 text-white font-bold'
                              : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold'
                          }`}
                        >
                          {item.count} {item.count === 1 ? 'link' : 'links'}
                        </span>
                        <ArrowRight
                          className={`w-3.5 h-3.5 transition-transform ${
                            isSelected
                              ? 'text-white translate-x-0.5'
                              : 'text-zinc-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: URLs with Selected Tag (8 cols) */}
          <div className="lg:col-span-8 rounded-3xl bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-white/[0.08] p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-white/[0.06] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-black text-indigo-600 dark:text-indigo-400">
                    #{selectedTag || 'Select a tag'}
                  </span>
                  {selectedTag && (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/20">
                      {links.length} matching {links.length === 1 ? 'link' : 'links'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {selectedTag
                    ? `Showing all shortened URLs associated with the #${selectedTag} tag`
                    : 'Choose any tag on the left to see its associated URLs'}
                </p>
              </div>

              {selectedTag && (
                <div className="relative sm:w-60">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search in this tag..."
                    value={urlSearch}
                    onChange={(e) => setUrlSearch(e.target.value)}
                    className="w-full rounded-xl text-xs pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-white/[0.08] focus:border-indigo-500 outline-hidden"
                  />
                </div>
              )}
            </div>

            {/* Links Content */}
            {!selectedTag ? (
              <div className="py-20 text-center text-zinc-400 space-y-2">
                <FolderOpen className="w-12 h-12 mx-auto opacity-30 text-indigo-500" />
                <p className="font-semibold text-zinc-700 dark:text-zinc-300">No tag selected</p>
                <p className="text-xs">Click on any tag from the list on the left to inspect its URLs.</p>
              </div>
            ) : isLoadingLinks ? (
              <div className="py-20 text-center text-xs text-zinc-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                Fetching URLs for #{selectedTag}...
              </div>
            ) : filteredLinks.length === 0 ? (
              <div className="py-16 text-center text-zinc-400 space-y-2">
                <Link2 className="w-10 h-10 mx-auto opacity-30 text-indigo-500 -rotate-45" />
                <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {urlSearch ? 'No URLs match your filter' : `No URLs found with tag #${selectedTag}`}
                </p>
                <p className="text-xs">
                  Attach this tag to your links using the Quick Tag box above!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLinks.map((link) => {
                  const domain = getDomainFromUrl(link.longUrl);
                  return (
                    <div
                      key={link.shortId}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-50/70 dark:bg-[#18181b]/70 border border-zinc-200/80 dark:border-white/[0.06] hover:border-indigo-500/40 hover:bg-zinc-50 dark:hover:bg-[#18181b] transition-all"
                    >
                      {/* Left: Domain Favicon, Title, URLs */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
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
                            className="font-bold text-sm text-zinc-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate block text-left cursor-pointer"
                            title="Visit destination"
                          >
                            {link.title || `/${link.customPath || link.shortId}`}
                          </button>

                          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                            <button
                              type="button"
                              onClick={() => handleVisitLink(link)}
                              className="hover:underline cursor-pointer"
                            >
                              /{link.customPath || link.shortId}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyLink(link.shortId, link.customPath)}
                              className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-indigo-500 cursor-pointer"
                              title="Copy short link"
                            >
                              {copiedId === link.shortId ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {link.passwordProtected && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-sans font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                <Lock className="w-2.5 h-2.5" /> Protected
                              </span>
                            )}

                            {link.createdAt && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-sans text-zinc-400 ml-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(link.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            )}
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

                          {/* All tags on this link */}
                          {link.tags && link.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {link.tags.map((t) => (
                                <span
                                  key={t}
                                  onClick={() => setSelectedTag(t)}
                                  className={`text-[10px] px-1.5 py-0.5 rounded-md border cursor-pointer transition-colors ${
                                    t === selectedTag
                                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/[0.08] hover:text-indigo-600'
                                  }`}
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Clicks & Action buttons */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-white/[0.04]">
                        <button
                          type="button"
                          onClick={() => setAnalyticsShortId(link.shortId)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-colors cursor-pointer"
                          title="View analytics"
                        >
                          <MousePointerClick className="w-3 h-3 text-cyan-500" />
                          <span>{link.clickCount.toLocaleString()} clicks</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleVisitLink(link)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingUrl(link)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Edit Tags & Metadata"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteUrl(link.shortId)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Delete URL"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Link Modal */}
      <UrlEditModal
        url={editingUrl}
        isOpen={!!editingUrl}
        onClose={() => setEditingUrl(null)}
        onUpdated={() => {
          fetchTagsAndAllLinks();
          if (selectedTag) fetchTaggedLinks(selectedTag);
        }}
      />

      {/* Analytics Modal */}
      <UrlAnalyticsModal
        shortId={analyticsShortId}
        isOpen={!!analyticsShortId}
        onClose={() => setAnalyticsShortId(null)}
      />

      {/* Password Challenge Modal */}
      <UrlPasswordModal
        shortId={passwordModalShortId}
        isOpen={!!passwordModalShortId}
        onClose={() => setPasswordModalShortId(null)}
      />
    </DashboardLayout>
  );
};
