'use client';

import { motion } from 'framer-motion';
import { ShoppingCart, Plus, Minus, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { StockWithoutDeleted } from '@/lib/stock-db';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  stock: StockWithoutDeleted;
}

export default function ProductCard({ stock }: ProductCardProps) {
  const { cart, addToCart, updateQuantity } = useCart();
  
  const cartItem = cart.find((item) => item.stock.id === stock.id);
  const quantity = cartItem?.quantity || 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="group h-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 flex flex-col">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
          {stock.gambar ? (
            <Image
              src={stock.gambar}
              alt={stock.namaBarang}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageIcon className="h-12 w-12 text-slate-300 dark:text-slate-600" />
            </div>
          )}
          
          {stock.stock === 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
              <span className="text-white font-bold text-xs uppercase tracking-widest px-4 py-2 bg-red-500/80 rounded-full shadow-lg">
                Habis
              </span>
            </div>
          )}

          <div className="absolute top-2 right-2 flex flex-col gap-2">
            {stock.stock > 0 && stock.stock < 10 && (
              <span className="bg-orange-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm backdrop-blur-sm">
                Sisa {stock.stock}
              </span>
            )}
          </div>
        </div>

        <CardContent className="p-4 flex flex-col flex-1 justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight min-h-[2.5rem]">
              {stock.namaBarang}
            </h3>
            <p className="text-xl font-black text-primary">
              Rp {stock.hargaJual.toLocaleString('id-ID')}
            </p>
          </div>

          <div className="mt-4">
            {quantity > 0 ? (
              <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => updateQuantity(stock.id, -1)}
                  className="h-8 w-8 rounded-lg hover:bg-white dark:hover:bg-slate-800 hover:text-red-500 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="flex-1 text-center font-bold text-sm">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => updateQuantity(stock.id, 1)}
                  className="h-8 w-8 rounded-lg hover:bg-white dark:hover:bg-slate-800 hover:text-primary transition-colors"
                  disabled={stock.stock > 0 && quantity >= stock.stock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => addToCart(stock)}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-primary dark:hover:bg-primary hover:text-white dark:hover:text-white font-bold rounded-xl shadow-md hover:shadow-xl transition-all duration-300 py-6"
                disabled={stock.stock === 0}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Tambah
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
