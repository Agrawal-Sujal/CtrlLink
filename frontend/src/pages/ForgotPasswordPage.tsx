import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { AlertBanner } from '../components/AlertBanner';
import { authApi, getErrorMessage } from '../services/api';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError('Please provide your registered email address.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.forgotPassword(email.trim());
      setSuccessMessage(response || 'Password reset link sent! Check your inbox.');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email and we'll send you a secure link to reset your password."
      badge="Account Recovery"
    >
      <div className="space-y-5">
        {error && (
          <AlertBanner
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {successMessage ? (
          <div className="space-y-5 text-center py-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Check Your Email
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                We've sent a password reset link to{' '}
                <span className="font-semibold text-zinc-900 dark:text-white">{email}</span>.
                The link is valid for 1 hour.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200/80 dark:border-white/[0.08] text-xs text-zinc-500 dark:text-zinc-400 text-left">
              <p className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Didn't receive it?</p>
              <p>Check your Spam folder, or click the button below to request another email.</p>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSuccessMessage(null)}
              >
                Send Again
              </Button>

              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:underline pt-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Registered Email"
              type="email"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
              autoComplete="email"
            />

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<Send className="w-4 h-4" />}
            >
              Send Reset Link
            </Button>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </AuthLayout>
  );
};
