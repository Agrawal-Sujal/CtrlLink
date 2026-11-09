import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  BarChart3,
  Link2,
  Lock,
  Tag,
  Globe,
  QrCode,
  Download,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '../Button';

interface UrlSuccessModalProps {
  url: {
    shortId: string;
    customPath?: string;
    shortUrl: string;
    longUrl: string;
    title?: string;
    passwordProtected?: boolean;
    tags?: string[];
    createdAt?: string;
    clickCount?: number;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onViewAnalytics?: (shortId: string) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const UrlSuccessModal: React.FC<UrlSuccessModalProps> = ({
  url,
  isOpen,
  onClose,
  onViewAnalytics,
}) => {
  const [copiedShort, setCopiedShort] = useState(false);
  const [copiedLong, setCopiedLong] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  if (!isOpen || !url) return null;

  // Consistent short URL representation using backend redirect URL
  const displayShortUrl =
    url.shortUrl && !url.shortUrl.includes('/r/')
      ? url.shortUrl
      : `${API_BASE_URL}/${url.customPath || url.shortId}`;

  const handleCopyShort = () => {
    navigator.clipboard.writeText(displayShortUrl);
    setCopiedShort(true);
    setTimeout(() => setCopiedShort(false), 2000);
  };

  const handleCopyLong = () => {
    navigator.clipboard.writeText(url.longUrl);
    setCopiedLong(true);
    setTimeout(() => setCopiedLong(false), 2000);
  };

  const handleDownloadQr = () => {
    const svg = document.getElementById('url-qr-code-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `ctrllink-${url.shortId}-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-white/[0.08] shadow-2xl p-6 sm:p-7 space-y-5 text-zinc-900 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Link2 className="w-5 h-5 -rotate-45" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Short URL Generated</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Ready to share with instant 302 redirection.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Short Link Display with Copy & QR toggle */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Your Short Link
            </label>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Instant 302 Redirection Active
            </span>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-2xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-white/[0.08]">
            <div className="flex-1 px-3 font-mono text-sm sm:text-base font-semibold text-indigo-600 dark:text-indigo-400 truncate select-all">
              {displayShortUrl}
            </div>
            <button
              type="button"
              onClick={() => setShowQrCode(!showQrCode)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                showQrCode
                  ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                  : 'border-zinc-200 dark:border-white/[0.08] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title="Toggle QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <Button
              size="sm"
              variant={copiedShort ? 'secondary' : 'primary'}
              onClick={handleCopyShort}
              leftIcon={copiedShort ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            >
              {copiedShort ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        {/* QR Code Expandable Drawer */}
        {showQrCode && (
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-white/[0.08] flex flex-col items-center justify-center space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-3 bg-white rounded-2xl shadow-md inline-block">
              <QRCodeSVG
                id="url-qr-code-svg"
                value={displayShortUrl}
                size={160}
                level="M"
                includeMargin={false}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadQr}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Download QR Code (PNG)
              </Button>
            </div>
          </div>
        )}

        {/* Original Long Destination URL */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" />
              Original Destination
            </label>
            <button
              type="button"
              onClick={handleCopyLong}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copiedLong ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLong ? 'Copied' : 'Copy destination'}</span>
            </button>
          </div>

          <a
            href={url.longUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 rounded-2xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-white/[0.08] text-xs font-mono text-zinc-700 dark:text-zinc-300 truncate hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-400/40 transition-colors"
            title="Click to open original URL directly"
          >
            {url.longUrl}
          </a>
        </div>

        {/* Metadata Details */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181b]/60 border border-zinc-200/80 dark:border-white/[0.06] text-xs space-y-2">
          {url.title && (
            <div className="flex justify-between items-start gap-2">
              <span className="text-zinc-500 dark:text-zinc-400 shrink-0">Title:</span>
              <span className="font-semibold text-zinc-900 dark:text-white truncate">
                {url.title}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">Access Type:</span>
            {url.passwordProtected ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                <Lock className="w-3 h-3" /> Password Protected
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Public (Instant Direct)</span>
            )}
          </div>

          {url.tags && url.tags.length > 0 && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-zinc-500 dark:text-zinc-400">Tags:</span>
              <div className="flex flex-wrap gap-1">
                {url.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 text-[10px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-500/20"
                  >
                    <Tag className="w-2.5 h-2.5" /> {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {onViewAnalytics && (
            <Button
              variant="outline"
              className="flex-1"
              leftIcon={<BarChart3 className="w-4 h-4 text-indigo-500" />}
              onClick={() => {
                onClose();
                onViewAnalytics(url.shortId);
              }}
            >
              View Analytics
            </Button>
          )}

          <a
            href={url.longUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button
              variant="primary"
              className="w-full"
              rightIcon={<ExternalLink className="w-4 h-4" />}
            >
              Open Original URL
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};
