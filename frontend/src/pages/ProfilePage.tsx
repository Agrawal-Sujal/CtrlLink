import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { logger } from '../utils/logger';

const log = logger.withModule('ProfilePage');
import {
  User as UserIcon,
  Mail,
  Camera,
  Upload,
  AlertCircle,
  CheckCircle2,
  Save,
  Send,
  ArrowLeft,
  X,
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { AlertBanner } from '../components/AlertBanner';
import { useAuth } from '../context/AuthContext';
import { profileApi, authApi, getErrorMessage } from '../services/api';

export const ProfilePage: React.FC = () => {
  const { user, updateUser, refreshProfile } = useAuth();

  // Profile fields state
  const [name, setName] = useState(user?.name || '');
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    user?.profilePictureUrl || null
  );
  const [emailVerified, setEmailVerified] = useState<boolean>(user?.emailVerified || false);

  // UI state
  const [isSavingName, setIsSavingName] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [alert, setAlert] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Photo upload & preview
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Load latest profile from backend on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileApi.getProfile();
        setName(data.name);
        setEmailVerified(data.emailVerified);
        if (data.profilePictureUrl && !data.profilePictureUrl.includes('cloudinaryService.')) {
          setProfilePictureUrl(data.profilePictureUrl);
        }
        updateUser({
          name: data.name,
          email: data.email,
          emailVerified: data.emailVerified,
          profilePictureUrl: data.profilePictureUrl || undefined,
        });
      } catch (err) {
        log.warn('Could not fetch backend profile:', err);
      }
    };

    fetchProfile();
  }, []);

  // Handle file select for Profile Picture
  const handleProfilePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAlert({ type: 'error', message: 'Please select an image file (PNG, JPG, WebP).' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAlert({ type: 'error', message: 'Image size must be less than 5MB.' });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPendingPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit profile picture upload to backend
  const handleUploadProfilePicture = async () => {
    if (!selectedFile && !pendingPreview) return;

    setIsUploadingPhoto(true);
    setAlert(null);

    try {
      if (selectedFile) {
        const res = await profileApi.uploadPicture(selectedFile);
        const finalUrl =
          res.profilePictureUrl && !res.profilePictureUrl.includes('cloudinaryService.')
            ? res.profilePictureUrl
            : pendingPreview!;

        setProfilePictureUrl(finalUrl);
        updateUser({ profilePictureUrl: finalUrl });

        setAlert({
          type: 'success',
          message: 'Profile picture updated successfully!',
        });
      }
      setPendingPreview(null);
      setSelectedFile(null);
    } catch (err: unknown) {
      setAlert({
        type: 'error',
        message: getErrorMessage(err),
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleCancelPreview = () => {
    setPendingPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit display name update to backend POST /api/v1/profile/settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setAlert({ type: 'error', message: 'Name cannot be blank.' });
      return;
    }

    setIsSavingName(true);
    setAlert(null);

    try {
      const res = await profileApi.updateSettings({ name: name.trim() });
      updateUser({ name: name.trim() });
      setAlert({
        type: 'success',
        message: res.message || 'Profile updated successfully!',
      });
      await refreshProfile();
    } catch (err: unknown) {
      setAlert({
        type: 'error',
        message: getErrorMessage(err),
      });
    } finally {
      setIsSavingName(false);
    }
  };

  // Resend verification email
  const handleResendVerification = async () => {
    if (!user?.email) return;
    setIsResendingEmail(true);
    setAlert(null);

    try {
      await authApi.resendVerification(user.email);
      setAlert({
        type: 'success',
        message: 'A fresh verification link has been sent to your email address.',
      });
    } catch (err: unknown) {
      setAlert({
        type: 'error',
        message: getErrorMessage(err),
      });
    } finally {
      setIsResendingEmail(false);
    }
  };

  const activeAvatar = pendingPreview || profilePictureUrl;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Links
          </Link>
          <span className="text-xs font-semibold text-zinc-400">CtrlLink Account</span>
        </div>

        {/* Global Alert Notification */}
        {alert && (
          <AlertBanner
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Notice if Email is not verified */}
        {!emailVerified && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="text-left text-xs sm:text-sm">
                <p className="font-bold">Email verification remaining</p>
                <p className="opacity-90 text-xs">
                  Please verify your email address to unlock link protection features.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              isLoading={isResendingEmail}
              onClick={handleResendVerification}
              leftIcon={<Send className="w-3.5 h-3.5" />}
              className="border-amber-500/30 hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 shrink-0"
            >
              Resend verification email
            </Button>
          </div>
        )}

        {/* Main Clean Profile Card */}
        <div className="rounded-3xl bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-white/[0.08] shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-zinc-100 dark:border-white/[0.06] pb-4">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Profile Details</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Update your photo, personal name, and account details.
            </p>
          </div>

          {/* Profile Photo Uploader */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-4 rounded-2xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200/80 dark:border-white/[0.08]">
            {/* Avatar */}
            <div className="relative group shrink-0 mx-auto sm:mx-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-linear-to-tr from-indigo-500 to-cyan-400 p-0.5 shadow-md">
                <div className="w-full h-full rounded-[14px] overflow-hidden bg-zinc-900 flex items-center justify-center text-white relative">
                  {activeAvatar ? (
                    <img
                      src={activeAvatar}
                      alt={name || 'Avatar'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-extrabold text-2xl uppercase">
                      {name ? name[0] : 'U'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Photo Actions */}
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div>
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">
                  Profile Photo
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  PNG, JPG or WebP up to 5MB.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleProfilePhotoSelect}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  id="profile-photo-input"
                />

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  leftIcon={<Camera className="w-3.5 h-3.5" />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change Photo
                </Button>

                {pendingPreview && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      isLoading={isUploadingPhoto}
                      leftIcon={<Upload className="w-3.5 h-3.5" />}
                      onClick={handleUploadProfilePicture}
                    >
                      Save Photo
                    </Button>
                    <button
                      type="button"
                      onClick={handleCancelPreview}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer"
                      title="Cancel preview"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details Form */}
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<UserIcon className="w-4 h-4" />}
              required
            />

            {/* Email (Read Only) */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Email Address
                </label>
                {emailVerified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-3.5 h-3.5" /> Unverified
                  </span>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full rounded-xl text-sm py-2.5 pl-10 pr-3.5 bg-zinc-100 dark:bg-[#18181b]/60 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/[0.08] cursor-not-allowed outline-hidden"
                />
              </div>
              <p className="text-[11px] text-zinc-400">
                Email address is tied to your account identity and login credentials.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                isLoading={isSavingName}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Details
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};
