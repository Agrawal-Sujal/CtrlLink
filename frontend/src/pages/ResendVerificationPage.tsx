import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { AlertBanner } from '../components/AlertBanner';
import { authApi, getErrorMessage } from '../services/api';

export const ResendVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please provide your email address.');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resendVerification(email.trim());
      setIsSuccess(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Resend Verification"
      subtitle="Request a fresh verification link to activate your CtrlLink account."
      badge="Email Verification"
    >
      <div className="space-y-5">
        {error && (
          <AlertBanner
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {isSuccess ? (
          <div className="space-y-5 text-center py-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Verification Email Dispatched!
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                A new verification email has been sent to{' '}
                <span className="font-semibold text-zinc-900 dark:text-white">{email}</span>.
                Please check your inbox (and spam folder) and click the link to activate your account.
              </p>
            </div>

            <div className="pt-2">
              <Link to="/login">
                <Button className="w-full">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Account Email Address"
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
              Send New Verification Link
            </Button>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
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
