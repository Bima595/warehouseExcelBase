'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  History,
  ChevronRight,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  href?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    href: '/dashboard',
  },
  {
    title: 'Menu Item',
    icon: <Package className="h-5 w-5" />,
    children: [
      {
        title: 'Stock',
        icon: <Package className="h-5 w-5" />,
        href: '/stock',
      },
      {
        title: 'Cashier',
        icon: <ShoppingCart className="h-5 w-5" />,
        href: '/cashier',
      },
    ],
  },
  {
    title: 'History',
    icon: <History className="h-5 w-5" />,
    href: '/history',
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Menu Item']);

  const toggleExpand = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname?.startsWith(href + '/');
  };

  const isParentActive = (item: MenuItem): boolean => {
    if (item.href && isActive(item.href)) return true;
    if (item.children) {
      return item.children.some((child) => isParentActive(child));
    }
    return false;
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.title);
    const isItemActive = isParentActive(item);
    const isChildActive = item.href ? isActive(item.href) : false;

    return (
      <div key={item.title}>
        {item.href && !hasChildren ? (
          <Link
            href={item.href}
            onClick={onMobileClose}
            className={cn(
              'flex items-center justify-between px-4 py-3 transition-colors',
              level > 0 && 'pl-8',
              isChildActive && 'bg-primary/10 text-primary border-r-2 border-primary',
              !isChildActive && 'hover:bg-accent',
              'text-sm font-medium'
            )}
          >
            <div className="flex items-center gap-3 flex-1">
              <span className="text-muted-foreground">{item.icon}</span>
              <span className="flex-1">{item.title}</span>
            </div>
          </Link>
        ) : (
          <>
            <div
              className={cn(
                'flex items-center justify-between px-4 py-3 cursor-pointer transition-colors',
                level > 0 && 'pl-8',
                isItemActive && hasChildren && 'bg-accent',
                !isItemActive && 'hover:bg-accent',
                'text-sm font-medium'
              )}
              onClick={() => {
                if (hasChildren) {
                  toggleExpand(item.title);
                }
              }}
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="text-muted-foreground">{item.icon}</span>
                <span className="flex-1">{item.title}</span>
              </div>
              {hasChildren && (
                <span className="text-muted-foreground">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </span>
              )}
            </div>
            {hasChildren && isExpanded && (
              <div className="bg-background/50">
                {item.children?.map((child) => renderMenuItem(child, level + 1))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Menu Utama</h2>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {menuItems.map((item) => renderMenuItem(item))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar - Always visible on screens >= 640px */}
      <aside className="hidden sm:flex sm:fixed sm:left-0 sm:top-0 sm:z-40 sm:h-screen sm:w-64 sm:border-r sm:bg-background sm:flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={(open) => !open && onMobileClose?.()}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  );
}

