'use client';

import { Edit3, Trash2, QrCode, ImageIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import type { StockWithoutDeleted } from '@/lib/stock-db';

interface StockCardProps {
  stock: StockWithoutDeleted;
  onEdit: (stock: StockWithoutDeleted) => void;
  onDelete: (id: string) => void;
}

export default function StockCard({ stock, onEdit, onDelete }: StockCardProps) {
  const profitMargin = ((stock.hargaJual - stock.hargaBeli) / stock.hargaBeli) * 100;
  
  return (
    <Card className="group h-full border-none bg-white dark:bg-slate-900 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 rounded-[2.5rem] overflow-hidden flex flex-col">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {stock.gambar ? (
          <Image
            src={stock.gambar}
            alt={stock.namaBarang}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, 400px"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-16 w-16 text-slate-300 dark:text-slate-700" />
          </div>
        )}
        
        {/* Profit Badge */}
        <div className="absolute top-4 left-4">
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg ${
            profitMargin > 0 ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
          }`}>
            {profitMargin > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(profitMargin).toFixed(0)}% Margin
          </div>
        </div>

        {/* Stock Badge */}
        <div className="absolute top-4 right-4">
          <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg ${
            stock.stock > 10 ? 'bg-white/90 text-slate-900' : 'bg-amber-500/90 text-white'
          }`}>
            {stock.stock} Unit
          </div>
        </div>
      </div>

      <CardContent className="p-8 flex-1 flex flex-col">
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight min-h-[3.5rem] group-hover:text-primary transition-colors">
              {stock.namaBarang}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Beli</p>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                Rp {stock.hargaBeli.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Jual</p>
              <p className="text-lg font-black text-primary tracking-tighter">
                Rp {stock.hargaJual.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-8">
          <Link href={`/stock/${stock.id}/view`} className="flex-1">
            <Button variant="outline" className="w-full h-12 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-800 transition-all font-bold">
              <QrCode className="mr-2 h-4 w-4" />
              QR
            </Button>
          </Link>
          <Button
            onClick={() => onEdit(stock)}
            className="h-12 w-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-primary dark:hover:bg-primary hover:text-white transition-all shadow-lg"
          >
            <Edit3 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => onDelete(stock.id)}
            className="h-12 w-12 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
