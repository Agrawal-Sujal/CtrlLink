import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight, Inbox, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AuthLayout } from '../components/AuthLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { AlertBanner } from '../components/AlertBanner';
import { PasswordStrength } from '../components/PasswordStrength';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import { logger } from '../utils/logger';

const log = logger.withModule('RegisterPage');

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (e) {
        log.error('Confetti error:', e);
      }

      setRegisteredSuccess(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (registeredSuccess) {
    return (
      <AuthLayout
        title="Check Your Inbox"
        subtitle={`We sent a verification link to ${email}`}
        badge="Account Created"
      >
        <div className="text-center space-y-6 py-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
            <Inbox className="w-8 h-8 animate-bounce" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Welcome to CtrlLink! 🎉
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              We've created your account and dispatched a confirmation link. Please check your inbox to verify your email.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 text-left space-y-2.5">
            <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Next Steps:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
              <li>
                Open your inbox (<span className="text-blue-600 dark:text-blue-400 font-semibold">{email}</span>)
              </li>
              <li>Click the "Verify your email" link</li>
              <li>You can also proceed directly into your dashboard right now!</li>
            </ul>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              onClick={() => navigate('/')}
              className="w-full"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue to Dashboard
            </Button>

            <Link
              to={`/resend-verification?email=${encodeURIComponent(email)}`}
              className="inline-block text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Didn't receive the email? Resend verification
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Start shortening, branding, and analyzing links with CtrlLink."
      badge="Instant Free Access"
    >
      <div className="space-y-5">
        {error && (
          <AlertBanner
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {/* Google Sign-Up */}
        <div className="space-y-3">
          <GoogleAuthButton onErrorCallback={(msg) => setError(msg)} />

          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-[#111827] px-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold absolute select-none">
              or register with email
            </span>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
            required
            autoComplete="name"
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="john@domain.com"
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
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
              autoComplete="new-password"
            />
            <PasswordStrength password={password} />
          </div>

          <Input
            label="Confirm Password"
            isPassword
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
            autoComplete="new-password"
            error={
              confirmPassword && password !== confirmPassword
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
            Create Account
          </Button>
        </form>

        {/* Terms notice */}
        <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 leading-relaxed">
          By signing up, you agree to our{' '}
          <span className="underline hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
            Terms of Service
          </span>{' '}
          and{' '}
          <span className="underline hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
            Privacy Policy
          </span>
          .
        </p>

        {/* Footer Link to Login */}
        <div className="pt-2 text-center text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800/60">
          <span>Already have an account? </span>
          <Link
            to="/login"
            className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline"
          >
            Sign In here
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};
