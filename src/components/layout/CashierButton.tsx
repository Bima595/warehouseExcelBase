'use client';

import { ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

export default function CashierButton() {
  const router = useRouter();
  const pathname = usePathname();

  // Jangan tampilkan di halaman login dan register
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  return (
    <motion.div
      className="fixed bottom-24 right-6 z-50"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
    >
      <motion.div
        whileHover={{ scale: 1.1, y: -5 }}
        whileTap={{ scale: 0.95 }}
        animate={{ y: [0, -8, 0] }}
        transition={{ 
          y: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
          scale: { type: 'spring', stiffness: 400, damping: 17 }
        }}
      >
        <Button
          onClick={() => router.push('/cashier')}
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
          aria-label="Cashier"
        >
          <motion.div
            whileHover={{ scale: 1.2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <ShoppingCart className="h-5 w-5" />
          </motion.div>
        </Button>
      </motion.div>
    </motion.div>
  );
}

