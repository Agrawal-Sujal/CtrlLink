import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Lock, ArrowRight, KeyRound } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { AlertBanner } from '../components/AlertBanner';
import { urlApi, getErrorMessage } from '../services/api';

export const PasswordChallengePage: React.FC = () => {
  const params = useParams();
  const rawPath = params['*'] || params.shortId || window.location.pathname.replace(/^\/p\//, '');
  const shortId = rawPath.replace(/^\//, '');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shortId) return;

    if (!password.trim()) {
      setError('Please enter the password for this link.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await urlApi.resolvePassword(shortId, password);
      if (res && res.longUrl) {
        window.location.href = res.longUrl;
      } else {
        setError('Unable to resolve target destination.');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Incorrect password. Access denied.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Protected Link"
      subtitle={`The link /${shortId || ''} is password protected. Enter the password to continue.`}
      badge="Security Checkpoint"
    >
      <div className="space-y-5">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
          <Lock className="w-8 h-8" />
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
            label="Link Password"
            isPassword
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<KeyRound className="w-4 h-4" />}
            required
            autoFocus
          />

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Unlock &amp; Redirect
          </Button>
        </form>

        <div className="pt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
          <span>Protected by </span>
          <Link to="/" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            CtrlLink Security
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};
