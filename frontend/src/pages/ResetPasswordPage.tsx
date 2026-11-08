import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AuthLayout } from '../components/AuthLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { AlertBanner } from '../components/AlertBanner';
import { PasswordStrength } from '../components/PasswordStrength';
import { authApi, getErrorMessage } from '../services/api';
import { logger } from '../utils/logger';

const log = logger.withModule('ResetPasswordPage');

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError('Password reset token is missing or invalid. Please click the link from your email.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({
        token: token.trim(),
        newPassword,
      });

      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        log.error('Confetti error:', e);
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout
        title="Password Updated"
        subtitle="Your password has been successfully reset."
        badge="Security Complete"
      >
        <div className="text-center space-y-6 py-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              All Set!
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              You can now sign in using your new credentials.
            </p>
          </div>

          <Button
            onClick={() => navigate('/login')}
            className="w-full"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Go to Sign In
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create New Password"
      subtitle="Choose a strong, secure password for your CtrlLink account."
      badge="Set New Credentials"
    >
      <div className="space-y-5">
        {error && (
          <AlertBanner
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {!searchParams.get('token') && (
          <AlertBanner
            type="warning"
            message="No reset token was detected in the URL. If you received an email link, please make sure you copied the full URL."
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!searchParams.get('token') && (
            <Input
              label="Reset Token"
              type="text"
              placeholder="Paste token from email"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              leftIcon={<KeyRound className="w-4 h-4" />}
              required
            />
          )}

          <div className="space-y-1">
            <Input
              label="New Password"
              isPassword
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
              autoComplete="new-password"
            />
            <PasswordStrength password={newPassword} />
          </div>

          <Input
            label="Confirm New Password"
            isPassword
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
            autoComplete="new-password"
            error={
              confirmPassword && newPassword !== confirmPassword
                ? 'Passwords do not match'
                : undefined
            }
          />

          <Button
            type="submit"
            className="w-full mt-2"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Reset Password
          </Button>
        </form>

        <div className="pt-2 text-center">
          <Link
            to="/login"
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            Cancel and Return to Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};
