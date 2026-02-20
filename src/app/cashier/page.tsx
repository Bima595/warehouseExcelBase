'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, ShoppingCart, LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { getStocksAction } from '@/app/actions/stock';
import type { StockWithoutDeleted } from '@/lib/stock-db';
import { useCart } from '@/context/CartContext';
import CheckoutDialog from '@/components/cashier/CheckoutDialog';
import ProductCard from '@/components/cashier/ProductCard';
import CartDrawer from '@/components/cashier/CartDrawer';

function CashierPageContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { cart, addToCart, getTotal, itemCount, clearCart } = useCart();
  
  const [stocks, setStocks] = useState<StockWithoutDeleted[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const loadStocks = async () => {
    try {
      const result = await getStocksAction();
      if (result.success && result.stocks) {
        setStocks(result.stocks);
      }
    } catch (error) {
      console.error('Error loading stocks:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memuat data stock',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-add from QR scan
  useEffect(() => {
    const addId = searchParams.get('add');
    if (addId && stocks.length > 0) {
      const stock = stocks.find((s) => s.id === addId);
      if (stock) {
        addToCart(stock);
        toast({
          title: 'Barang Ditambahkan',
          description: `${stock.namaBarang} telah ditambahkan ke keranjang`,
        });
        window.history.replaceState({}, '', '/cashier');
      }
    }
  }, [searchParams, stocks, addToCart, toast]);

  const filteredStocks = useMemo(() => 
    stocks.filter((stock) =>
      stock.namaBarang.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [stocks, searchQuery]
  );

  const handleCheckoutSuccess = () => {
    clearCart();
    loadStocks();
    setCheckoutOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header Area */}
        <header className="px-6 py-8 space-y-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tighter">KASIR POS</h1>
              <p className="text-sm text-slate-500 font-medium">Kelola transaksi harian Anda dengan cepat</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant={viewMode === 'grid' ? 'default' : 'outline'} 
                size="icon" 
                onClick={() => setViewMode('grid')}
                className="rounded-xl"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'default' : 'outline'} 
                size="icon" 
                onClick={() => setViewMode('list')}
                className="rounded-xl"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
              <Input
                type="text"
                placeholder="Cari produk berdasarkan nama atau scan barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl text-base focus-visible:ring-2 focus-visible:ring-primary shadow-inner"
              />
            </div>

            {/* Mobile/Tablet Cart Trigger */}
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <Button
                  className="lg:hidden relative h-14 w-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl"
                >
                  <ShoppingCart className="h-6 w-6" />
                  {itemCount > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-slate-950 shadow-lg"
                    >
                      {itemCount > 99 ? '99+' : itemCount}
                    </motion.span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md p-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                <CartDrawer onCheckout={() => { setCheckoutOpen(true); setCartOpen(false); }} />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Product Selection Area */}
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="aspect-3/4 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : filteredStocks.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4"
            >
              <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center">
                <Search className="h-10 w-10 text-slate-300 dark:text-slate-700" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Produk Tidak Ditemukan</h3>
                <p className="text-slate-500 max-w-xs">Kami tidak dapat menemukan produk dengan nama &quot;{searchQuery}&quot;</p>
              </div>
              <Button variant="outline" onClick={() => setSearchQuery('')} className="rounded-xl">Hapus Pencarian</Button>
            </motion.div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
                : "flex flex-col gap-4 max-w-4xl mx-auto"
            }>
              <AnimatePresence mode="popLayout">
                {filteredStocks.map((stock) => (
                  <ProductCard key={stock.id} stock={stock} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>

      {/* Desktop Cart Sidebar */}
      <aside className="hidden lg:flex w-[400px] xl:w-[450px] border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] z-20">
        <CartDrawer onCheckout={() => setCheckoutOpen(true)} />
      </aside>

      {/* Dialogs */}
      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        items={cart.map(item => ({
          stockId: item.stock.id,
          quantity: item.quantity
        }))}
        total={getTotal()}
        onSuccess={handleCheckoutSuccess}
      />
    </div>
  );
}

export default function CashierPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-sm font-medium text-slate-500">Memuat halaman kasir...</p>
        </div>
      </div>
    }>
      <CashierPageContent />
    </Suspense>
  );
}
