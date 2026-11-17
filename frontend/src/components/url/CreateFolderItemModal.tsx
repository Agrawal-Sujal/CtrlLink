import React, { useState } from 'react';
import {
  X,
  FolderPlus,
  Link2,
  Zap,
  Folder,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Check,
} from 'lucide-react';
import { urlApi, getErrorMessage } from '../../services/api';
import { ShortenResponse } from '../../types/url';

type ItemType = 'folder' | 'custom_url' | 'auto_url';

interface CreateFolderItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetFolder: string; // e.g. "" (root), "youtube", "project/ctrllink"
  onFolderCreated: (newFolderPath: string) => void;
  onUrlCreated: (response: ShortenResponse) => void;
}

export const CreateFolderItemModal: React.FC<CreateFolderItemModalProps> = ({
  isOpen,
  onClose,
  targetFolder,
  onFolderCreated,
  onUrlCreated,
}) => {
  const [itemType, setItemType] = useState<ItemType>('custom_url');

  // Folder form state
  const [folderName, setFolderName] = useState('');

  // URL form state
  const [longUrl, setLongUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [title, setTitle] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [expiryDays, setExpiryDays] = useState<number | undefined>(undefined);
  const [isExpiryEnabled, setIsExpiryEnabled] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const cleanTargetFolder = targetFolder.trim().toLowerCase().replace(/^\/+|\/+$/g, '');
  const displayFolderPath = cleanTargetFolder ? `/${cleanTargetFolder}` : '/ (Root)';

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

  const resetForm = () => {
    setFolderName('');
    setLongUrl('');
    setCustomAlias('');
    setTitle('');
    setPassword('');
    setShowPassword(false);
    setExpiryDays(undefined);
    setIsExpiryEnabled(false);
    setTags([]);
    setTagInput('');
    setErrorMessage(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (itemType === 'folder') {
      const cleanName = folderName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');
      if (!cleanName) {
        setErrorMessage('Please provide a valid folder name (letters, numbers, hyphens).');
        return;
      }
      if (cleanName.includes('/')) {
        setErrorMessage('Folder name cannot contain slashes.');
        return;
      }

      const fullNewFolderPath = cleanTargetFolder
        ? `${cleanTargetFolder}/${cleanName}`
        : cleanName;

      onFolderCreated(fullNewFolderPath);
      handleClose();
      return;
    }

    // URL creation (custom or auto)
    if (!longUrl.trim()) {
      setErrorMessage('Please enter a destination URL.');
      return;
    }

    if (!longUrl.startsWith('http://') && !longUrl.startsWith('https://')) {
      setErrorMessage('Destination URL must start with http:// or https://');
      return;
    }

    let fullAliasForBackend = '';

    if (itemType === 'custom_url') {
      const cleanAlias = customAlias.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');
      if (!cleanAlias) {
        setErrorMessage('Please provide a custom alias for this URL.');
        return;
      }
      fullAliasForBackend = cleanTargetFolder
        ? `${cleanTargetFolder}/${cleanAlias}`
        : cleanAlias;
    } else {
      // Auto-generated URL
      // If targetFolder is not empty, pass trailing slash to instruct backend to generate a slug in that folder
      fullAliasForBackend = cleanTargetFolder ? `${cleanTargetFolder}/` : '';
    }

    setIsSubmitting(true);
    try {
      const response = await urlApi.shorten({
        longUrl: longUrl.trim(),
        customAlias: fullAliasForBackend || undefined,
        title: title.trim() || undefined,
        password: password.trim() || undefined,
        expiryDays: isExpiryEnabled ? expiryDays : undefined,
        tags: tags.length > 0 ? tags : undefined,
      });

      onUrlCreated(response);
      handleClose();
    } catch (err: unknown) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview of final URL path
  const previewPath = () => {
    if (itemType === 'folder') {
      const cleanName = folderName.trim().toLowerCase() || '[folder-name]';
      return cleanTargetFolder ? `/${cleanTargetFolder}/${cleanName}` : `/${cleanName}`;
    }
    if (itemType === 'custom_url') {
      const cleanAlias = customAlias.trim().toLowerCase() || '[alias]';
      return cleanTargetFolder ? `/${cleanTargetFolder}/${cleanAlias}` : `/${cleanAlias}`;
    }
    // Auto URL
    return cleanTargetFolder ? `/${cleanTargetFolder}/[auto-id]` : '/[auto-id]';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Create in <span className="text-blue-600 dark:text-blue-400">{displayFolderPath}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose to create a new folder, custom short link, or auto-generated link
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Item Type Selector Cards */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              What do you want to create?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {/* Option 1: Folder */}
              <button
                type="button"
                onClick={() => setItemType('folder')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                  itemType === 'folder'
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <FolderPlus className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                  {itemType === 'folder' && <Check className="w-4 h-4 text-blue-600" />}
                </div>
                <div>
                  <div className="text-xs font-bold">Subfolder</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Nested category
                  </div>
                </div>
              </button>

              {/* Option 2: Custom URL */}
              <button
                type="button"
                onClick={() => setItemType('custom_url')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                  itemType === 'custom_url'
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Link2 className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400 -rotate-45" />
                  {itemType === 'custom_url' && <Check className="w-4 h-4 text-blue-600" />}
                </div>
                <div>
                  <div className="text-xs font-bold">Custom URL</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Specific alias
                  </div>
                </div>
              </button>

              {/* Option 3: Auto-generated URL */}
              <button
                type="button"
                onClick={() => setItemType('auto_url')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                  itemType === 'auto_url'
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Zap className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400 fill-emerald-600/20" />
                  {itemType === 'auto_url' && <Check className="w-4 h-4 text-blue-600" />}
                </div>
                <div>
                  <div className="text-xs font-bold">Auto URL</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Auto-generated slug
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Path Preview Banner */}
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Path Preview:</span>
            <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
              {previewPath()}
            </span>
          </div>

          {/* Conditional Form Fields */}
          {itemType === 'folder' ? (
            /* Folder Form */
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Folder Name <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    placeholder="e.g. project, youtube, resources"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="w-full text-xs sm:text-sm py-2 pl-3 pr-8 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
                  />
                  <Folder className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
                </div>
                <p className="text-[11px] text-slate-400">
                  Lowercase letters, numbers, and hyphens only.
                </p>
              </div>
            </div>
          ) : (
            /* URL Forms (Custom & Auto) */
            <div className="space-y-4">
              {/* Destination URL */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Destination Long URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/very/long/destination/url"
                  value={longUrl}
                  onChange={(e) => setLongUrl(e.target.value)}
                  className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              {/* Custom Alias (only for custom_url) */}
              {itemType === 'custom_url' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Custom Alias <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      required
                      placeholder="e.g. ctrllink, tutorial, react"
                      value={customAlias}
                      onChange={(e) => setCustomAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="w-full text-xs sm:text-sm py-2 pl-3 pr-8 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
                    />
                    <Link2 className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none -rotate-45" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Specific short identifier for this link under {displayFolderPath}.
                  </p>
                </div>
              )}

              {/* Optional Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Link Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Official Documentation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              {/* Password Protection & Expiry Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Password Protection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password (Optional)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="4-20 chars"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-xs sm:text-sm py-2 pl-3 pr-8 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expiry Days */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Auto-Expiry
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !isExpiryEnabled;
                        setIsExpiryEnabled(next);
                        if (!next) setExpiryDays(undefined);
                        else if (!expiryDays) setExpiryDays(7);
                      }}
                      className={`text-[11px] font-medium transition-colors cursor-pointer ${
                        isExpiryEnabled ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {isExpiryEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    disabled={!isExpiryEnabled}
                    placeholder="Days (1-365)"
                    value={expiryDays ?? ''}
                    onChange={(e) => setExpiryDays(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    className="w-full text-xs sm:text-sm py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Tags Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tags (Optional)
                </label>
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus-within:border-blue-500">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-red-500 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder={tags.length === 0 ? 'Type tag and press Enter' : 'Add another...'}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddTag(tagInput);
                      }
                    }}
                    className="flex-1 min-w-[120px] text-xs bg-transparent outline-hidden text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-400">
              {errorMessage}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>
                    {itemType === 'folder'
                      ? 'Create Folder'
                      : itemType === 'custom_url'
                      ? 'Create Custom Link'
                      : 'Generate Auto Link'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
