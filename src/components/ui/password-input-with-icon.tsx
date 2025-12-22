'use client';

import * as React from 'react';
import { Eye, EyeOff, LucideIcon } from 'lucide-react';
import { Input } from './input';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface PasswordInputWithIconProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: LucideIcon;
}

const PasswordInputWithIcon = React.forwardRef<HTMLInputElement, PasswordInputWithIconProps>(
  ({ className, icon: Icon, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
        <Input
          type={showPassword ? 'text' : 'password'}
          className={cn('pl-10 pr-10', className)}
          ref={ref}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
    );
  }
);
PasswordInputWithIcon.displayName = 'PasswordInputWithIcon';

export { PasswordInputWithIcon };

