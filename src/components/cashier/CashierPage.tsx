'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, ShoppingCart, Plus, Minus, X, ImageIcon, Loader2, PackageSearch } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { getStocksAction } from '@/app/actions/stock';
import type { StockWithoutDeleted } from '@/lib/stock-db';
import Image from 'next/image';
import CheckoutDialog from './CheckoutDialog';
import { useCart, type CartItem } from '@/hooks/use-cart';

export default function CashierPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { cart, addToCart, updateQuantity, removeFromCart, clearCart, getTotal, cartItemCount } = useCart();
  
  const [stocks, setStocks] = useState<StockWithoutDeleted[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const loadStocksData = useCallback(async () => {
    try {
      const result = await getStocksAction();
      if (result.success && result.stocks) {
        setStocks(result.stocks);
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memuat data stock',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadStocksData();
  }, [loadStocksData]);

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
    ), [stocks, searchQuery]
  );

  const handleCheckoutSuccess = () => {
    clearCart();
    loadStocksData();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#020617] w-full font-sans">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full min-w-0">
        {/* Header */}
        <header className="border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl px-4 sm:px-8 py-4 sm:py-6 sticky top-0 z-10 w-full shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-4 w-full">
            <div className="flex-1 min-w-0 relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
              </div>
              <Input
                type="text"
                placeholder="Cari produk di gudang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 h-12 bg-slate-100/50 dark:bg-slate-900/50 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all rounded-2xl text-base"
              />
            </div>
            
            {/* Mobile Cart Trigger */}
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="relative lg:hidden h-12 w-12 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <AnimatePresence>
                    {cartItemCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900"
                      >
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-[440px] p-0 border-none bg-white dark:bg-slate-950 flex flex-col">
                <CartSidebarContent 
                  cart={cart} 
                  updateQuantity={updateQuantity} 
                  removeFromCart={removeFromCart} 
                  total={getTotal()} 
                  onCheckout={() => { setCheckoutOpen(true); setCartOpen(false); }}
                />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-transparent custom-scrollbar">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">Menghubungkan ke gudang...</p>
              </div>
            </div>
          ) : filteredStocks.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-8">
              <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 rounded-3xl flex items-center justify-center mb-6">
                <PackageSearch className="h-12 w-12 text-slate-300 dark:text-slate-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Produk tidak ditemukan</h3>
              <p className="text-slate-500 max-w-xs">Coba gunakan kata kunci lain atau pastikan stok produk tersedia.</p>
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredStocks.map((stock) => (
                  <ProductCard 
                    key={stock.id} 
                    stock={stock} 
                    cartQuantity={cart.find(i => i.stock.id === stock.id)?.quantity || 0}
                    onAdd={() => addToCart(stock)}
                    onUpdate={(delta) => updateQuantity(stock.id, delta)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[440px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-950 flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
        <CartSidebarContent 
          cart={cart} 
          updateQuantity={updateQuantity} 
          removeFromCart={removeFromCart} 
          total={getTotal()} 
          onCheckout={() => setCheckoutOpen(true)}
        />
      </aside>

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        items={cart.map((item) => ({
          stockId: item.stock.id,
          quantity: item.quantity
        }))}
        total={getTotal()}
        onSuccess={handleCheckoutSuccess}
      />
    </div>
  );
}

function ProductCard({ stock, cartQuantity, onAdd, onUpdate }: { 
  stock: StockWithoutDeleted, 
  cartQuantity: number, 
  onAdd: () => void,
  onUpdate: (delta: number) => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className="group relative"
    >
      <Card className="h-full border-none bg-white dark:bg-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] transition-all duration-300 rounded-[2rem] overflow-hidden">
        <div className="relative aspect-4/3 overflow-hidden">
          {stock.gambar ? (
            <Image
              src={stock.gambar}
              alt={stock.namaBarang}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 1024px) 100vw, 300px"
            />
          ) : (
            <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <ImageIcon className="h-12 w-12 text-slate-300 dark:text-slate-700" />
            </div>
          )}
          
          {/* Badge Stock */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm ${
              stock.stock > 10 
                ? 'bg-white/90 text-slate-900' 
                : stock.stock > 0 
                  ? 'bg-amber-500/90 text-white' 
                  : 'bg-red-500/90 text-white'
            }`}>
              {stock.stock === 0 ? 'Habis' : `Stok: ${stock.stock}`}
            </span>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight min-h-11">
              {stock.namaBarang}
            </h3>
            <p className="text-2xl font-black text-primary tracking-tighter mt-1">
              Rp {stock.hargaJual.toLocaleString('id-ID')}
            </p>
          </div>

          {cartQuantity > 0 ? (
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onUpdate(-1)}
                className="h-10 w-10 rounded-xl hover:bg-white dark:hover:bg-slate-800 shadow-sm transition-all"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="flex-1 text-center font-black text-lg text-slate-900 dark:text-slate-100">
                {cartQuantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onUpdate(1)}
                disabled={stock.stock > 0 && cartQuantity >= stock.stock}
                className="h-10 w-10 rounded-xl hover:bg-white dark:hover:bg-slate-800 shadow-sm transition-all"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={onAdd}
              disabled={stock.stock === 0}
              className="w-full h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-primary dark:hover:bg-primary hover:text-white transition-all font-bold text-base shadow-lg shadow-slate-900/5"
            >
              {stock.stock === 0 ? 'Stok Kosong' : (
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Tambah</span>
                </div>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface CartSidebarContentProps {
  cart: CartItem[];
  updateQuantity: (stockId: string, delta: number) => void;
  removeFromCart: (stockId: string) => void;
  total: number;
  onCheckout: () => void;
}

function CartSidebarContent({ cart, updateQuantity, removeFromCart, total, onCheckout }: CartSidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-8 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Checkout</h2>
            <p className="text-sm text-slate-500 font-medium">Ringkasan belanja anda</p>
          </div>
          <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center">
            <ShoppingCart className="h-6 w-6 text-primary" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        <AnimatePresence initial={false}>
          {cart.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center p-8"
            >
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center mb-4">
                <ShoppingCart className="h-10 w-10 text-slate-200 dark:text-slate-800" />
              </div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Keranjang Kosong</p>
            </motion.div>
          ) : (
            cart.map((item) => (
              <motion.div
                key={item.stock.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="group relative bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex gap-4">
                  <div className="h-16 w-16 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                    {item.stock.gambar ? (
                      <Image src={item.stock.gambar} alt={item.stock.namaBarang} width={64} height={64} className="object-cover h-full w-full" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center"><ImageIcon className="h-6 w-6 text-slate-300" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate text-sm">{item.stock.namaBarang}</h4>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      Rp {item.stock.hargaJual.toLocaleString('id-ID')}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center bg-slate-50 dark:bg-slate-950 rounded-xl px-1 border border-slate-100 dark:border-slate-800">
                        <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.stock.id, -1)} className="h-7 w-7 rounded-lg"><Minus className="h-3 w-3" /></Button>
                        <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                        <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.stock.id, 1)} className="h-7 w-7 rounded-lg"><Plus className="h-3 w-3" /></Button>
                      </div>
                      <p className="text-sm font-black text-primary">Rp {(item.stock.hargaJual * item.quantity).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromCart(item.stock.id)}
                    className="absolute -top-2 -right-2 h-8 w-8 bg-white dark:bg-slate-800 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {cart.length > 0 && (
        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between text-slate-500 font-bold uppercase tracking-widest text-[10px]">
              <span>Subtotal</span>
              <span>Rp {total.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">Total</span>
              <span className="text-3xl font-black text-primary tracking-tighter">Rp {total.toLocaleString('id-ID')}</span>
            </div>
          </div>
          <Button 
            onClick={onCheckout}
            className="w-full h-16 rounded-[1.5rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-primary dark:hover:bg-primary hover:text-white transition-all font-black text-lg shadow-2xl shadow-slate-900/20"
          >
            Selesaikan Pesanan
          </Button>
        </div>
      )}
    </div>
  );
}

// End of component
