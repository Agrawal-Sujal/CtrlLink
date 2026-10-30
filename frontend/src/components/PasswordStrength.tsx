import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  if (!password) return null;

  const checks = [
    { label: 'At least 6 characters', valid: password.length >= 6 },
    { label: 'Contains a number', valid: /\d/.test(password) },
    { label: 'Contains uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'Contains special character', valid: /[^A-Za-z0-9]/.test(password) },
  ];

  const passedCount = checks.filter((c) => c.valid).length;

  const getStrengthMeta = () => {
    if (password.length < 6) {
      return { score: 1, label: 'Too short (min 6 chars)', color: 'bg-rose-500', text: 'text-rose-500' };
    }
    if (passedCount <= 2) {
      return { score: 2, label: 'Weak', color: 'bg-amber-500', text: 'text-amber-500' };
    }
    if (passedCount === 3) {
      return { score: 3, label: 'Good', color: 'bg-cyan-500', text: 'text-cyan-500' };
    }
    return { score: 4, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-500' };
  };

  const meta = getStrengthMeta();

  return (
    <div className="w-full space-y-2 mt-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/[0.08] text-xs">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-500 dark:text-zinc-400">Password Strength:</span>
        <span className={`font-semibold ${meta.text}`}>{meta.label}</span>
      </div>

      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-full rounded-full transition-all duration-300 ${
              step <= meta.score ? meta.color : 'bg-zinc-200 dark:bg-zinc-800'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-1.5 pt-1">
        {checks.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-1.5 text-[11px] ${
              item.valid
                ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                : 'text-zinc-400 dark:text-zinc-500'
            }`}
          >
            {item.valid ? (
              <Check className="w-3 h-3 shrink-0 stroke-[2.5]" />
            ) : (
              <X className="w-3 h-3 shrink-0 opacity-70" />
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
