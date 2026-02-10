'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;
  const isActiveParent = (path: string) => pathname?.startsWith(path);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">Warehouse</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link href="/dashboard">
              <Button
                variant={isActive('/dashboard') ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'gap-2',
                  isActive('/dashboard') && 'bg-primary text-primary-foreground'
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={isActiveParent('/stock') || isActiveParent('/cashier') ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'gap-2',
                    (isActiveParent('/stock') || isActiveParent('/cashier')) && 'bg-primary text-primary-foreground'
                  )}
                >
                  Menu Item
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link href="/stock" className="flex items-center gap-2 w-full">
                    <Package className="h-4 w-4" />
                    Stock
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/cashier" className="flex items-center gap-2 w-full">
                    <ShoppingCart className="h-4 w-4" />
                    Cashier
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}


