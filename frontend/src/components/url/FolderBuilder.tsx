import React, { useState, useEffect, useMemo } from 'react';
import {
  Folder,
  FolderPlus,
  Plus,
  X,
  ChevronRight,
  Sparkles,
  Check,
  AlertCircle,
  Terminal,
  Layers,
} from 'lucide-react';

interface FolderBuilderProps {
  value: string;
  onChange: (value: string) => void;
  existingFolders?: string[];
  baseUrl?: string;
}

const MAX_TOTAL_SEGMENTS = 5;
const SEGMENT_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

export const FolderBuilder: React.FC<FolderBuilderProps> = ({
  value,
  onChange,
  existingFolders = [],
  baseUrl = 'ctrllink.io',
}) => {
  // Modes: 'folder' | 'root' | 'raw'
  const [activeTab, setActiveTab] = useState<'folder' | 'root' | 'raw'>('folder');

  // Internal state for visual builder
  const [folders, setFolders] = useState<string[]>([]);
  const [slug, setSlug] = useState<string>('');
  const [isAutoSlug, setIsAutoSlug] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Clean domain display
  const displayHost = useMemo(() => {
    try {
      if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
        return new URL(baseUrl).host;
      }
      return baseUrl;
    } catch {
      return baseUrl;
    }
  }, [baseUrl]);

  // Sync internal state from raw external value initially or when reset externally
  useEffect(() => {
    if (!value) {
      setFolders([]);
      setSlug('');
      setIsAutoSlug(false);
      return;
    }

    const trimmed = value.trim().toLowerCase();
    const endsWithSlash = trimmed.endsWith('/');
    const parts = trimmed.split('/').filter(Boolean);

    if (parts.length === 0) {
      setFolders([]);
      setSlug('');
      setIsAutoSlug(false);
      return;
    }

    if (endsWithSlash) {
      // e.g. "youtube/videos/"
      setFolders(parts);
      setSlug('');
      setIsAutoSlug(true);
      setActiveTab('folder');
    } else if (parts.length === 1) {
      // Single segment (root alias)
      setFolders([]);
      setSlug(parts[0]);
    } else {
      // Multi-segment: folder1/folder2/.../slug
      setFolders(parts.slice(0, parts.length - 1));
      setSlug(parts[parts.length - 1]);
      setIsAutoSlug(false);
      setActiveTab('folder');
    }
  }, [value]);

  // Sanitizer helper for segment input
  const sanitizeSegment = (input: string) => {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-');
  };

  // Compute and emit updated value
  const emitUpdate = (
    newFolders: string[],
    newSlug: string,
    newAutoSlug: boolean
  ) => {
    setValidationError(null);

    // Validate segments
    for (const f of newFolders) {
      if (!f) {
        setValidationError('Folder names cannot be empty.');
        return;
      }
      if (!SEGMENT_REGEX.test(f)) {
        setValidationError(`Invalid folder segment "${f}". Use lowercase letters, numbers, and hyphens.`);
        return;
      }
    }

    if (!newAutoSlug && newSlug && !SEGMENT_REGEX.test(newSlug)) {
      setValidationError(`Invalid slug "${newSlug}". Use lowercase letters, numbers, and hyphens.`);
      return;
    }

    const totalCount = newFolders.length + (newAutoSlug || newSlug ? 1 : 0);
    if (totalCount > MAX_TOTAL_SEGMENTS) {
      setValidationError(`Maximum depth is ${MAX_TOTAL_SEGMENTS} segments.`);
      return;
    }

    if (newFolders.length === 0) {
      if (newAutoSlug) {
        onChange('');
      } else {
        onChange(newSlug ? sanitizeSegment(newSlug) : '');
      }
      return;
    }

    const folderPath = newFolders.map(sanitizeSegment).join('/');
    if (newAutoSlug) {
      onChange(`${folderPath}/`);
    } else if (newSlug) {
      onChange(`${folderPath}/${sanitizeSegment(newSlug)}`);
    } else {
      onChange(`${folderPath}/`);
    }
  };

  // Add a subfolder level
  const handleAddFolder = () => {
    const currentTotal = folders.length + (isAutoSlug || slug ? 1 : 0);
    if (currentTotal >= MAX_TOTAL_SEGMENTS) {
      setValidationError(`Cannot exceed ${MAX_TOTAL_SEGMENTS} total path segments.`);
      return;
    }

    const nextIndex = folders.length + 1;
    const newFolders = [...folders, `folder${nextIndex}`];
    setFolders(newFolders);
    emitUpdate(newFolders, slug, isAutoSlug);
  };

  // Remove a folder level
  const handleRemoveFolder = (index: number) => {
    const newFolders = folders.filter((_, i) => i !== index);
    setFolders(newFolders);
    emitUpdate(newFolders, slug, isAutoSlug);
  };

  // Update folder segment text
  const handleFolderChange = (index: number, val: string) => {
    const sanitized = sanitizeSegment(val);
    const newFolders = [...folders];
    newFolders[index] = sanitized;
    setFolders(newFolders);
    emitUpdate(newFolders, slug, isAutoSlug);
  };

  // Update terminal slug
  const handleSlugChange = (val: string) => {
    const sanitized = sanitizeSegment(val);
    setSlug(sanitized);
    emitUpdate(folders, sanitized, isAutoSlug);
  };

  // Toggle auto-slug mode
  const handleToggleAutoSlug = (checked: boolean) => {
    setIsAutoSlug(checked);
    emitUpdate(folders, slug, checked);
  };

  // Pick an existing folder
  const handleSelectExistingFolder = (folderPath: string) => {
    const parts = folderPath.split('/').filter(Boolean).map(sanitizeSegment);
    setFolders(parts);
    setActiveTab('folder');
    emitUpdate(parts, slug, isAutoSlug);
  };

  // Switch tabs
  const handleTabChange = (tab: 'folder' | 'root' | 'raw') => {
    setActiveTab(tab);
    if (tab === 'root') {
      setFolders([]);
      emitUpdate([], slug, false);
    } else if (tab === 'folder') {
      if (folders.length === 0) {
        setFolders(['links']);
        emitUpdate(['links'], slug, isAutoSlug);
      }
    }
  };

  const currentSegmentCount = folders.length + (isAutoSlug || slug ? 1 : 0);

  return (
    <div className="w-full space-y-4 rounded-2xl bg-zinc-50/80 dark:bg-[#151518] border border-zinc-200/90 dark:border-white/[0.08] p-4 sm:p-5 transition-all">
      {/* Header & Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200/60 dark:border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Folder className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
                URL Structure &amp; Folders
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-2.5 h-2.5" />
                Custom Paths
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Organize destinations into directories or craft custom branded aliases.
            </p>
          </div>
        </div>

        {/* Builder Mode Selector */}
        <div className="flex items-center p-1 rounded-xl bg-zinc-200/60 dark:bg-zinc-850/90 border border-zinc-200 dark:border-white/[0.08] text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleTabChange('folder')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'folder'
                ? 'bg-white dark:bg-[#1e1e24] text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Folder Path</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('root')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'root'
                ? 'bg-white dark:bg-[#1e1e24] text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Root Alias</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('raw')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'raw'
                ? 'bg-white dark:bg-[#1e1e24] text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
            title="Direct text input for power users"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Direct Text</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Interactive Folder Path Builder */}
      {activeTab === 'folder' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Segment Chips & Path Chain */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              <span className="flex items-center gap-1.5">
                <FolderPlus className="w-3.5 h-3.5 text-indigo-500" />
                Folder Hierarchy ({folders.length} level{folders.length !== 1 ? 's' : ''})
              </span>
              <span className={`text-[11px] font-mono ${currentSegmentCount >= MAX_TOTAL_SEGMENTS ? 'text-amber-500 font-bold' : 'text-zinc-400'}`}>
                {currentSegmentCount} / {MAX_TOTAL_SEGMENTS} segments used
              </span>
            </label>

            {/* Breadcrumb Builder Row */}
            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] min-h-[50px]">
              {/* Domain Prefix */}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono text-xs select-none">
                {displayHost}/
              </span>

              {/* Folder Segments */}
              {folders.map((seg, idx) => (
                <React.Fragment key={idx}>
                  <div className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-indigo-700 dark:text-indigo-300 text-xs font-mono shadow-xs">
                    <Folder className="w-3 h-3 text-indigo-500 shrink-0" />
                    <input
                      type="text"
                      value={seg}
                      onChange={(e) => handleFolderChange(idx, e.target.value)}
                      placeholder="folder-name"
                      className="bg-transparent border-none outline-hidden text-xs font-mono font-semibold w-24 sm:w-28 text-indigo-900 dark:text-indigo-200 placeholder:text-indigo-400/50"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFolder(idx)}
                      className="p-0.5 rounded-md text-indigo-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Remove folder segment"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 shrink-0" />
                </React.Fragment>
              ))}

              {/* Add Subfolder Button */}
              {currentSegmentCount < MAX_TOTAL_SEGMENTS && (
                <button
                  type="button"
                  onClick={handleAddFolder}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold hover:bg-indigo-500/5 transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Subfolder</span>
                </button>
              )}
            </div>
          </div>

          {/* Terminal Slug Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Destination Link Slug
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled={isAutoSlug}
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder={isAutoSlug ? 'Auto-generated (e.g. 7hK9mP)' : 'e.g. documentation or review'}
                  className={`w-full rounded-xl text-xs sm:text-sm px-3 py-2 bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100 font-mono outline-hidden focus:border-indigo-500 transition-colors ${
                    isAutoSlug ? 'opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-zinc-900' : ''
                  }`}
                />
              </div>
            </div>

            {/* Auto-Slug Toggle */}
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] cursor-pointer hover:border-indigo-500/50 transition-colors">
                <input
                  type="checkbox"
                  checked={isAutoSlug}
                  onChange={(e) => handleToggleAutoSlug(e.target.checked)}
                  className="w-4 h-4 rounded-sm text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div className="text-left">
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Auto-generate Short ID
                  </p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Places an auto-generated unique slug inside the folder path
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Root Alias (No Folder) */}
      {activeTab === 'root' && (
        <div className="space-y-2 animate-in fade-in duration-150">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Custom Root Alias
          </label>
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] focus-within:border-indigo-500 transition-colors">
            <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono text-xs select-none">
              {displayHost}/
            </span>
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="e.g. summer-sale or portfolio"
              className="w-full bg-transparent text-xs sm:text-sm font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-hidden py-1"
            />
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            A single direct path without subfolders (e.g. <span className="font-mono text-indigo-500">/{displayHost}/launch</span>).
          </p>
        </div>
      )}

      {/* Mode 3: Direct Raw Text Input */}
      {activeTab === 'raw' && (
        <div className="space-y-2 animate-in fade-in duration-150">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Full Custom Path (Raw String)
          </label>
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-white/[0.08] focus-within:border-indigo-500 transition-colors">
            <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono text-xs select-none">
              {displayHost}/
            </span>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g. youtube/videos/programming or marketing/promo/"
              className="w-full bg-transparent text-xs sm:text-sm font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-hidden py-1"
            />
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Supports up to 5 segments. Add a trailing slash (e.g. <span className="font-mono text-indigo-500">youtube/videos/</span>) to auto-generate terminal slug.
          </p>
        </div>
      )}

      {/* Existing Folders Quick-Select Suggestions */}
      {existingFolders.length > 0 && (
        <div className="pt-2 border-t border-zinc-200/50 dark:border-white/[0.04] space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
            <Folder className="w-3 h-3 text-indigo-500" />
            <span>Quick-Pick Existing Folders:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {existingFolders.slice(0, 6).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => handleSelectExistingFolder(f)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-indigo-500/10 dark:bg-zinc-800 dark:hover:bg-indigo-500/20 text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-mono border border-zinc-200 dark:border-white/[0.08] transition-colors cursor-pointer"
                title={`Use folder path: /${f}`}
              >
                <Folder className="w-3 h-3 text-indigo-500" />
                <span>/{f}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Real-time Validation Error Banner */}
      {validationError && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Live URL Preview Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-indigo-500/[0.07] dark:bg-indigo-950/20 border border-indigo-500/20 text-xs">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="font-semibold text-indigo-700 dark:text-indigo-300 shrink-0">
            Live Preview:
          </span>
          <span className="font-mono text-indigo-600 dark:text-indigo-400 truncate">
            {displayHost}/
            {value ? (
              <span className="font-bold text-zinc-900 dark:text-white">
                {value.startsWith('/') ? value.slice(1) : value}
                {isAutoSlug && !value.endsWith('/') ? '/' : ''}
                {isAutoSlug && <span className="opacity-60 text-indigo-400">[auto-slug]</span>}
              </span>
            ) : (
              <span className="opacity-50 italic text-zinc-400">
                [auto-generated-id]
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold self-end sm:self-auto shrink-0">
          <Check className="w-3.5 h-3.5" />
          <span>Ready to route</span>
        </div>
      </div>
    </div>
  );
};
