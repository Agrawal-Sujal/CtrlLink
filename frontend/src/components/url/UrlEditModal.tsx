import React, { useState, useEffect } from 'react';
import { X, Save, Lock, Tag, Type, Plus } from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';
import { AlertBanner } from '../AlertBanner';
import { urlApi, getErrorMessage } from '../../services/api';
import { UrlStatsResponse } from '../../types/url';

interface UrlEditModalProps {
  url: UrlStatsResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const UrlEditModal: React.FC<UrlEditModalProps> = ({
  url,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [title, setTitle] = useState('');
  const [password, setPassword] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (url) {
      setTitle(url.title || '');
      setPassword('');
      setTags(url.tags ? Array.from(url.tags) : []);
      setError(null);
    }
  }, [url]);

  if (!isOpen || !url) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // 1. Update metadata (title & password)
      await urlApi.updateMetadata(url.shortId, {
        title: title.trim(),
        password: password ? password.trim() : undefined,
      });

      // 2. Update tags
      await urlApi.updateTags(url.shortId, tags);

      onUpdated();
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-white/[0.08] shadow-2xl p-6 sm:p-7 space-y-6 text-zinc-900 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/[0.06] pb-4">
          <div>
            <h2 className="text-lg font-bold">Edit Link Settings</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Update title, tags, or password for <span className="font-mono text-indigo-500">/{url.shortId}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <AlertBanner
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Link Title"
            type="text"
            placeholder="Custom title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            leftIcon={<Type className="w-4 h-4" />}
          />

          <div className="space-y-1.5">
            <Input
              label="Update Password"
              isPassword
              placeholder={url.passwordProtected ? '•••••••• (Leave blank to keep existing)' : 'Optional link password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              helperText={
                url.passwordProtected
                  ? 'Link is currently password-protected. Enter a new password to change it, or leave blank to keep it.'
                  : 'Add a password to protect this link.'
              }
            />
          </div>

          {/* Tags Manager */}
          <div className="space-y-2 text-left">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Tags
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Add a tag (e.g. social, docs)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="w-full rounded-xl text-xs sm:text-sm py-2 px-3 bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-white/[0.1] focus:border-indigo-500 outline-hidden"
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleAddTag}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add
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
                      className="p-0.5 rounded-full hover:bg-indigo-500/20 text-zinc-400 hover:text-zinc-700 dark:hover:text-white cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-white/[0.06]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
