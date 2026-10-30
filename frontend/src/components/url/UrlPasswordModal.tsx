import React, { useState } from 'react';
import { X, Lock, KeyRound, ExternalLink } from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';
import { AlertBanner } from '../AlertBanner';
import { urlApi, getErrorMessage } from '../../services/api';

interface UrlPasswordModalProps {
  shortId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UrlPasswordModal: React.FC<UrlPasswordModalProps> = ({
  shortId,
  isOpen,
  onClose,
}) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !shortId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter the password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await urlApi.resolvePassword(shortId, password.trim());
      if (res && res.longUrl) {
        window.open(res.longUrl, '_blank');
        onClose();
      } else {
        setError('Unable to unlock link destination.');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Incorrect password.');
    } finally {
      setIsLoading(false);
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
        className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-white/[0.08] shadow-2xl p-6 sm:p-7 space-y-5 text-zinc-900 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/[0.06] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">Password Protected Link</h3>
              <p className="text-xs text-zinc-500 font-mono">/{shortId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer"
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
            label="Enter Password"
            isPassword
            placeholder="Link password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<KeyRound className="w-4 h-4" />}
            required
            autoFocus
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              rightIcon={<ExternalLink className="w-4 h-4" />}
            >
              Unlock &amp; Visit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
