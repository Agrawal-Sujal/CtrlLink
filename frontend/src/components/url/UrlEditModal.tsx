import React, { useState, useEffect } from 'react';
import { X, Save, Lock, Type } from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';
import { TagInput } from './TagInput';
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
              Update title, tags, or password for <span className="font-mono text-indigo-500">/{url.customPath || url.shortId}</span>
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

          {/* Tags Manager with Autocomplete */}
          <TagInput selectedTags={tags} onChange={setTags} />

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
