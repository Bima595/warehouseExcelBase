'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, ShoppingCart, Plus, Minus, X, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { getStocksAction } from '@/app/actions/stock';
import type { StockWithoutDeleted } from '@/lib/stock-db';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import CheckoutDialog from './CheckoutDialog';

export interface CartItem {
  stock: StockWithoutDeleted;
  quantity: number;
}

export default function CashierPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [stocks, setStocks] = useState<StockWithoutDeleted[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Load stocks
  useEffect(() => {
    async function loadStocksData() {
      try {
        const result = await getStocksAction();
        if (result.success && result.stocks) {
          setStocks(result.stocks);
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Gagal memuat data stock',
        });
      } finally {
        setLoading(false);
      }
    }
    loadStocksData();
  }, [toast]);

  const addToCart = (stock: StockWithoutDeleted) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.stock.id === stock.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.stock.id === stock.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { stock, quantity: 1 }];
    });
    // Open cart on mobile when adding item
    if (window.innerWidth < 1024) {
      setCartOpen(true);
    }
  };

  // Auto-add from QR scan
  useEffect(() => {
    const addId = searchParams.get('add');
    if (addId && stocks.length > 0) {
      const stock = stocks.find((s) => s.id === addId);
      if (stock) {
        addToCart(stock);
        toast({
          variant: 'success',
          title: 'Barang Ditambahkan',
          description: `${stock.namaBarang} telah ditambahkan ke keranjang`,
        });
        // Remove query param
        window.history.replaceState({}, '', '/cashier');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, stocks]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cashier_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cashier_cart', JSON.stringify(cart));
  }, [cart]);


  const updateQuantity = (stockId: string, delta: number) => {
    setCart((prevCart) => {
      const item = prevCart.find((item) => item.stock.id === stockId);
      if (!item) return prevCart;

      const newQuantity = item.quantity + delta;
      if (newQuantity <= 0) {
        return prevCart.filter((item) => item.stock.id !== stockId);
      }

      return prevCart.map((item) =>
        item.stock.id === stockId
          ? { ...item, quantity: newQuantity }
          : item
      );
    });
  };

  const removeFromCart = (stockId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.stock.id !== stockId));
  };

  const getTotal = () => {
    return cart.reduce((total, item) => total + item.stock.hargaJual * item.quantity, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Keranjang kosong',
      });
      return;
    }
    setCheckoutOpen(true);
  };

  const handleCheckoutSuccess = () => {
    setCart([]);
    loadStocks(); // Reload stocks untuk update quantity
  };

  const loadStocks = async () => {
    try {
      const result = await getStocksAction();
      if (result.success && result.stocks) {
        setStocks(result.stocks);
      }
    } catch (error) {
      console.error('Error loading stocks:', error);
    }
  };

  const filteredStocks = stocks.filter((stock) =>
    stock.namaBarang.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex h-screen overflow-hidden bg-background w-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full min-w-0">
        {/* Header */}
        <header className="border-b bg-background px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-10 w-full max-w-full">
          <div className="flex items-center gap-3 sm:gap-4 w-full max-w-full">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
              <Input
                type="text"
                placeholder="Cari barang..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-9 sm:h-10 text-sm sm:text-base min-w-0"
              />
            </div>
            {/* Mobile Cart Button */}
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="relative sm:hidden h-9 w-9"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                      {cartItemCount > 9 ? '9+' : cartItemCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-96 p-0 flex flex-col">
                <SheetHeader className="p-4 sm:p-6 border-b bg-muted/50">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    <SheetTitle className="text-xl font-bold">Cart</SheetTitle>
                    {cart.length > 0 && (
                      <span className="ml-auto text-sm text-muted-foreground">
                        {cart.length} {cart.length === 1 ? 'item' : 'items'}
                      </span>
                    )}
                  </div>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                      <ShoppingCart className="h-20 w-20 mb-4 opacity-30" />
                      <p className="text-base font-medium">Keranjang kosong</p>
                      <p className="text-sm mt-1">Tambahkan barang ke keranjang</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <Card key={item.stock.id} className="overflow-hidden">
                        <div className="flex items-start gap-3 p-3">
                          <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0 border">
                            {item.stock.gambar ? (
                              <Image
                                src={item.stock.gambar}
                                alt={item.stock.namaBarang}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm leading-tight line-clamp-2">
                                  {item.stock.namaBarang}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Rp {item.stock.hargaJual.toLocaleString('id-ID')} / item
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFromCart(item.stock.id)}
                                className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => updateQuantity(item.stock.id, -1)}
                                  className="h-7 w-7"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="text-sm font-semibold w-8 text-center">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => updateQuantity(item.stock.id, 1)}
                                  className="h-7 w-7"
                                  disabled={item.stock.stock > 0 && item.quantity >= item.stock.stock}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="text-sm font-bold text-primary">
                                Rp {(item.stock.hargaJual * item.quantity).toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
                {cart.length > 0 && (
                  <div className="border-t bg-muted/30 p-4 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-base">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-semibold">Rp {getTotal().toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex items-center justify-between text-lg font-bold pt-2 border-t">
                        <span>Total</span>
                        <span className="text-primary">Rp {getTotal().toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    <Button onClick={() => { handleCheckout(); setCartOpen(false); }} className="w-full" size="lg" variant="default">
                      Checkout
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6 w-full max-w-full">
          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                <p className="text-sm text-muted-foreground">Memuat data...</p>
              </div>
            </div>
          ) : filteredStocks.length === 0 ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'Tidak ada barang yang ditemukan' : 'Belum ada data stock'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 w-full max-w-full">
              {filteredStocks.map((stock) => {
                const cartItem = cart.find((item) => item.stock.id === stock.id);
                const quantity = cartItem?.quantity || 0;

                return (
                  <Card key={stock.id} className="group overflow-hidden transition-all hover:shadow-lg border-2 hover:border-primary/50">
                    <div className="relative aspect-square w-full overflow-hidden bg-muted">
                      {stock.gambar ? (
                        <Image
                          src={stock.gambar}
                          alt={stock.namaBarang}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-muted">
                          <ImageIcon className="h-16 w-16 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-2 sm:p-3 lg:p-4 space-y-2 sm:space-y-3">
                      <h3 className="font-semibold text-xs sm:text-sm line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] leading-tight">
                        {stock.namaBarang}
                      </h3>
                      <div className="flex items-baseline justify-between gap-1">
                        <p className="text-sm sm:text-base lg:text-lg font-bold text-primary">
                          Rp {stock.hargaJual.toLocaleString('id-ID')}
                        </p>
                        {stock.stock > 0 && (
                          <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                            Stok: {stock.stock}
                          </span>
                        )}
                      </div>
                      {quantity > 0 ? (
                        <div className="flex items-center gap-1 sm:gap-2 pt-1 sm:pt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(stock.id, -1)}
                            className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 shrink-0"
                          >
                            <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <span className="flex-1 text-center font-semibold text-sm sm:text-base">
                            {quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(stock.id, 1)}
                            className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 shrink-0"
                            disabled={stock.stock > 0 && quantity >= stock.stock}
                          >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => addToCart(stock)}
                          className="w-full text-xs sm:text-sm"
                          disabled={stock.stock === 0}
                          size="sm"
                        >
                          {stock.stock === 0 ? 'Stok Habis' : 'Add to Cart'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Shopping Cart Sidebar - Desktop Only */}
      <aside className="hidden lg:flex w-96 border-l bg-background flex-col shadow-lg shrink-0">
        <div className="p-6 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <h2 className="text-xl font-bold">Cart</h2>
            {cart.length > 0 && (
              <span className="ml-auto text-sm text-muted-foreground">
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <ShoppingCart className="h-20 w-20 mb-4 opacity-30" />
              <p className="text-base font-medium">Keranjang kosong</p>
              <p className="text-sm mt-1">Tambahkan barang ke keranjang</p>
            </div>
          ) : (
            cart.map((item) => (
              <Card key={item.stock.id} className="overflow-hidden">
                <div className="flex items-start gap-3 p-3">
                  <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0 border">
                    {item.stock.gambar ? (
                      <Image
                        src={item.stock.gambar}
                        alt={item.stock.namaBarang}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm leading-tight line-clamp-2">
                          {item.stock.namaBarang}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Rp {item.stock.hargaJual.toLocaleString('id-ID')} / item
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.stock.id)}
                        className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.stock.id, -1)}
                          className="h-7 w-7"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-semibold w-8 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.stock.id, 1)}
                          className="h-7 w-7"
                          disabled={item.stock.stock > 0 && item.quantity >= item.stock.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm font-bold text-primary">
                        Rp {(item.stock.hargaJual * item.quantity).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
        {cart.length > 0 && (
          <div className="border-t bg-muted/30 p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-base">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">Rp {getTotal().toLocaleString('id-ID')}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">Rp {getTotal().toLocaleString('id-ID')}</span>
              </div>
            </div>
            <Button onClick={handleCheckout} className="w-full" size="lg" variant="default">
              Checkout
            </Button>
          </div>
        )}
      </aside>

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        cart={cart}
        total={getTotal()}
        onSuccess={handleCheckoutSuccess}
      />
    </div>
  );
}

