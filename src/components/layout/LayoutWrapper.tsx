'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Footer from './Footer';
import MobileHeader from './MobileHeader';

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Jangan tampilkan sidebar dan footer di halaman login dan register
  const hideLayout = pathname === '/login' || pathname === '/register';

  if (hideLayout) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <MobileHeader onMenuClick={() => setMobileMenuOpen(true)} />
      <div className="flex flex-1 flex-col sm:ml-64 pt-14 sm:pt-0 w-full min-w-0 overflow-x-hidden">
        <main className="flex-1 w-full min-w-0">{children}</main>
        <Footer />
      </div>
    </div>
  );
}

