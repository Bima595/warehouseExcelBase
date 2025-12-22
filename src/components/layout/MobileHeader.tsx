'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="sm:hidden fixed top-0 left-0 right-0 z-50 border-b bg-background px-4 py-3 w-full max-w-full">
      <div className="flex items-center gap-3 w-full max-w-full">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="h-9 w-9 shrink-0"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold truncate">Menu Utama</h1>
      </div>
    </header>
  );
}

