import React, { useState } from 'react';
import {
  Zap,
  Link2,
  ClipboardPaste,
  ChevronDown,
  ChevronUp,
  Folder,
  Eye,
  EyeOff,
  Info,
  X,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface QuickShortenCardProps {
  onShorten: (data: {
    longUrl: string;
    customAlias?: string;
    password?: string;
    expiryDays?: number;
    tags?: string[];
    useAutoTitle: boolean;
  }) => Promise<void>;
  isCreating: boolean;
  availableTags?: string[];
}

export const QuickShortenCard: React.FC<QuickShortenCardProps> = ({
  onShorten,
  isCreating,
  availableTags = [],
}) => {
  const [showOptions, setShowOptions] = useState(true);
  const [longUrl, setLongUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isExpiryEnabled, setIsExpiryEnabled] = useState(false);
  const [expiryDays, setExpiryDays] = useState<number | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [useAutoTitle, setUseAutoTitle] = useState(false);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);

  const handlePasteClipboard = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setLongUrl(clip.trim());
      }
    } catch {
      // Ignore clipboard read permission failures
    }
  };

  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim().replace(/^#/, '').toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const handleReset = () => {
    setLongUrl('');
    setCustomAlias('');
    setPassword('');
    setIsExpiryEnabled(false);
    setExpiryDays(undefined);
    setTags([]);
    setTagInput('');
    setUseAutoTitle(false);
    setDraftNotice(null);
  };

  const handleSaveDraft = () => {
    localStorage.setItem(
      'ctrllink_quick_shorten_draft',
      JSON.stringify({
        longUrl,
        customAlias,
        password,
        isExpiryEnabled,
        expiryDays,
        tags,
        useAutoTitle,
      })
    );
    setDraftNotice('Draft saved successfully!');
    setTimeout(() => setDraftNotice(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!longUrl.trim()) return;

    await onShorten({
      longUrl: longUrl.trim(),
      customAlias: customAlias.trim() || undefined,
      password: password.trim() || undefined,
      expiryDays: isExpiryEnabled ? expiryDays : undefined,
      tags: tags.length > 0 ? tags : undefined,
      useAutoTitle,
    });
  };

  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header: Quick Shorten title and options toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 fill-blue-600/20" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Quick Shorten
            </h2>
            <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline font-normal">
              Create a short link with custom settings
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors cursor-pointer select-none"
          >
            <span>Link Options</span>
            {showOptions ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Long URL Input Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-2 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 focus-within:border-blue-500 dark:focus-within:border-blue-500 transition-colors">
          <div className="flex items-center gap-2 w-full px-2.5 py-1 sm:py-0">
            <Link2 className="w-4.5 h-4.5 text-slate-400 -rotate-45 shrink-0" />
            <input
              type="text"
              placeholder="Paste a long URL (e.g. https://youtube.com/watch?v=...)"
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              className="w-full text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 bg-transparent outline-hidden py-1.5"
              required
            />
            {!longUrl && (
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Paste from clipboard"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Paste</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isCreating || !longUrl.trim()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-all cursor-pointer shrink-0"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Shortening...</span>
              </>
            ) : (
              <>
                <span>Shorten Link</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Expandable Options Grid */}
        {showOptions && (
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
            {/* 1. Custom Alias / Folder Path */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Custom Alias / Folder Path
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="youtube/videos/react"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  className="w-full text-xs sm:text-sm py-2 pl-3 pr-8 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
                />
                <Folder className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
              </div>
            </div>

            {/* 2. Password Protection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Password Protection
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs sm:text-sm py-2 pl-3 pr-8 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* 3. Auto-Expiry (TTL) with Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = !isExpiryEnabled;
                    setIsExpiryEnabled(next);
                    if (!next) setExpiryDays(undefined);
                    else if (!expiryDays) setExpiryDays(7);
                  }}
                  className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    isExpiryEnabled
                      ? 'bg-blue-600'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                  role="switch"
                  aria-checked={isExpiryEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      isExpiryEnabled ? 'translate-x-3.5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 select-none cursor-pointer">
                  Auto-Expiry (TTL)
                </label>
              </div>

              <select
                value={isExpiryEnabled ? (expiryDays || '') : ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setExpiryDays(val);
                  setIsExpiryEnabled(Boolean(val));
                }}
                className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
              >
                <option value="">Permanent</option>
                <option value="1">1 Day</option>
                <option value="7">7 Days</option>
                <option value="30">30 Days</option>
                <option value="90">90 Days</option>
                <option value="365">1 Year</option>
              </select>
            </div>

            {/* 4. Tags with Pills */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tags
              </label>
              <div className="flex flex-wrap items-center gap-1.5 p-1.5 min-h-[40px] rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-blue-800 dark:hover:text-blue-200 cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  list="quick-shorten-tags"
                  placeholder={tags.length === 0 ? 'Type tag & press enter' : '+tag'}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  className="flex-1 min-w-[60px] text-xs bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 outline-hidden px-1"
                />
                {availableTags.length > 0 && (
                  <datalist id="quick-shorten-tags">
                    {availableTags.map((at) => (
                      <option key={at} value={at} />
                    ))}
                  </datalist>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Bar: Smart AI Title Fetch & Reset / Save Draft */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
          {/* Smart AI Title Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUseAutoTitle(!useAutoTitle)}
              className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                useAutoTitle
                  ? 'bg-blue-600'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
              role="switch"
              aria-checked={useAutoTitle}
            >
              <span
                className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  useAutoTitle ? 'translate-x-3.5' : 'translate-x-0'
                }`}
              />
            </button>
            <span
              onClick={() => setUseAutoTitle(!useAutoTitle)}
              className="font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none"
            >
              Smart AI Title Fetch
            </span>
            <div className="relative group">
              <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-48 p-2 rounded-lg bg-slate-900 text-white text-[10px] leading-tight z-30 shadow-lg pointer-events-none">
                Automatically fetches title and summary metadata using AI.
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 ml-auto">
            {draftNotice && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px] animate-fade-in">
                {draftNotice}
              </span>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-3.5 py-1.5 rounded-lg text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 border border-blue-200/60 dark:border-blue-900/50 transition-colors cursor-pointer"
            >
              Save Draft
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
