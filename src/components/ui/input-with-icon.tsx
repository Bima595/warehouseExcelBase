'use client';

import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { Input } from './input';
import { cn } from '@/lib/utils';

export interface InputWithIconProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: LucideIcon;
}

const InputWithIcon = React.forwardRef<HTMLInputElement, InputWithIconProps>(
  ({ className, icon: Icon, ...props }, ref) => {
    return (
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className={cn('pl-10', className)}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
InputWithIcon.displayName = 'InputWithIcon';

export { InputWithIcon };


