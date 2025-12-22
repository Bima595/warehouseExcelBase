'use client';

import { useMemo } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: '', checks: [] };

    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;
    const labels = ['Sangat Lemah', 'Lemah', 'Sedang', 'Kuat', 'Sangat Kuat'];
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

    return {
      score,
      label: labels[score - 1] || '',
      color: colors[score - 1] || 'bg-gray-500',
      checks: [
        { label: 'Minimal 8 karakter', passed: checks.length },
        { label: 'Huruf besar', passed: checks.uppercase },
        { label: 'Huruf kecil', passed: checks.lowercase },
        { label: 'Angka', passed: checks.number },
        { label: 'Karakter khusus', passed: checks.special },
      ],
    };
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Kekuatan password:</span>
        <span className={cn('font-medium', strength.score >= 3 ? 'text-green-600 dark:text-green-400' : strength.score >= 2 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400')}>
          {strength.label}
        </span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-300',
              level <= strength.score ? strength.color : 'bg-muted'
            )}
          />
        ))}
      </div>
      <div className="space-y-1 text-xs">
        {strength.checks.map((check, index) => (
          <div key={index} className="flex items-center gap-2">
            {check.passed ? (
              <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={cn(check.passed ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground')}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

