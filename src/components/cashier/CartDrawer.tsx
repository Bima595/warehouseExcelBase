'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, Minus, X, ImageIcon, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCart } from '@/context/CartContext';

interface CartDrawerProps {
  onCheckout: () => void;
}

export default function CartDrawer({ onCheckout }: CartDrawerProps) {
  const { cart, updateQuantity, removeFromCart, getTotal, itemCount, clearCart } = useCart();

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <ShoppingCart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Keranjang</h2>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              {itemCount} Items
            </p>
          </div>
        </div>
        {cart.length > 0 && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={clearCart}
            className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence mode="popLayout">
          {cart.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12"
            >
              <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <ShoppingCart className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Keranjang Kosong</h3>
                <p className="text-sm text-slate-500">Mulai belanja untuk mengisi keranjang Anda</p>
              </div>
            </motion.div>
          ) : (
            cart.map((item) => (
              <motion.div
                key={item.stock.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              >
                <Card className="overflow-hidden border border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-4 flex gap-4">
                    <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/50 dark:border-slate-800">
                      {item.stock.gambar ? (
                        <Image
                          src={item.stock.gambar}
                          alt={item.stock.namaBarang}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-sm leading-tight line-clamp-2 pr-2">
                          {item.stock.namaBarang}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.stock.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-end justify-between">
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                          <button
                            onClick={() => updateQuantity(item.stock.id, -1)}
                            className="h-6 w-6 flex items-center justify-center rounded hover:bg-white dark:hover:bg-slate-700 transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-black w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.stock.id, 1)}
                            className="h-6 w-6 flex items-center justify-center rounded hover:bg-white dark:hover:bg-slate-700 transition-colors"
                            disabled={item.stock.stock > 0 && item.quantity >= item.stock.stock}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-sm font-black text-primary">
                          Rp {(item.stock.hargaJual * item.quantity).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {cart.length > 0 && (
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-widest">
              <span>Subtotal</span>
              <span className="text-slate-800 dark:text-slate-200">Rp {getTotal().toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-black tracking-tight">Total</span>
              <span className="text-2xl font-black text-primary">Rp {getTotal().toLocaleString('id-ID')}</span>
            </div>
          </div>
          <Button 
            onClick={onCheckout} 
            className="w-full h-14 text-lg font-black bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-primary dark:hover:bg-primary hover:text-white dark:hover:text-white rounded-2xl shadow-xl hover:shadow-primary/20 transition-all duration-300"
          >
            Checkout
          </Button>
        </div>
      )}
    </div>
  );
}
