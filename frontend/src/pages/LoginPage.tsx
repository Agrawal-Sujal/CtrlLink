import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AuthLayout } from '../components/AuthLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { AlertBanner } from '../components/AlertBanner';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import { logger } from '../utils/logger';

const log = logger.withModule('LoginPage');

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setVerificationSuccess(true);
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        log.error('Confetti error:', e);
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });
      navigate('/');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your CtrlLink account to manage your links &amp; analytics."
      badge="Secure Access"
    >
      <div className="space-y-5">
        {verificationSuccess && (
          <AlertBanner
            type="success"
            title="Email Verified!"
            message="Your email address has been verified successfully. Please enter your credentials to log in."
            onClose={() => setVerificationSuccess(false)}
          />
        )}

        {error && (
          <AlertBanner
            type="error"
            message={error}
            onClose={() => setError(null)}
            action={
              error.toLowerCase().includes('verif')
                ? {
                    label: 'Resend Verification Email',
                    onClick: () => navigate(`/resend-verification?email=${encodeURIComponent(email)}`),
                  }
                : undefined
            }
          />
        )}

        {/* Google Login Section */}
        <div className="space-y-3">
          <GoogleAuthButton
            onErrorCallback={(msg) => setError(msg)}
          />

          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-zinc-200 dark:border-white/[0.08] w-full" />
            <span className="bg-white dark:bg-[#121215] px-3 text-[11px] uppercase tracking-wider text-zinc-400 font-semibold absolute">
              or continue with email
            </span>
          </div>
        </div>

        {/* Traditional Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
            autoComplete="email"
          />

          <div className="space-y-1">
            <Input
              label="Password"
              isPassword
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
              autoComplete="current-password"
            />
            <div className="flex justify-end pt-1">
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full mt-2"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Sign In
          </Button>
        </form>

        {/* Footer Link to Register */}
        <div className="pt-2 text-center text-xs text-zinc-600 dark:text-zinc-400">
          <span>Don't have an account yet? </span>
          <Link
            to="/register"
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:underline"
          >
            Create one for free
          </Link>
        </div>

        {/* Quick link for unverified users */}
        <div className="text-center">
          <Link
            to="/resend-verification"
            className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            Didn't receive email verification? Resend link
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};
