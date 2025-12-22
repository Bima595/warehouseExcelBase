'use client';

import { Edit, Trash2, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import type { StockWithoutDeleted } from '@/lib/stock-db';
import { ImageIcon } from 'lucide-react';

interface StockCardProps {
  stock: StockWithoutDeleted;
  onEdit: (stock: StockWithoutDeleted) => void;
  onDelete: (id: string) => void;
}

export default function StockCard({ stock, onEdit, onDelete }: StockCardProps) {
  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg h-full flex flex-col">
      <div className="relative aspect-square w-full overflow-hidden bg-muted flex-shrink-0">
        {stock.gambar ? (
          <Image
            src={stock.gambar}
            alt={stock.namaBarang}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-16 w-16 text-muted-foreground/50" />
          </div>
        )}
      </div>
      <CardContent className="p-2 sm:p-3 lg:p-4 flex-1 flex flex-col">
        <h3 className="mb-1.5 sm:mb-2 line-clamp-2 font-semibold text-xs sm:text-sm leading-tight flex-shrink-0">
          {stock.namaBarang}
        </h3>
        <div className="mb-2 sm:mb-3 space-y-1 flex-shrink-0">
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            Stock: <span className="font-medium text-foreground">{stock.stock}</span>
          </p>
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">Harga Beli</p>
              <p className="text-[10px] sm:text-xs font-medium truncate">Rp {stock.hargaBeli.toLocaleString('id-ID')}</p>
            </div>
            <div className="text-right flex-1 min-w-0">
              <p className="text-[9px] sm:text-[10px] text-muted-foreground">Harga Jual</p>
              <p className="text-[10px] sm:text-xs font-semibold text-primary truncate">
                Rp {stock.hargaJual.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-1 sm:gap-1.5 mt-auto">
          <Link href={`/stock/${stock.id}/view`} className="flex-1 min-w-0">
            <Button variant="outline" size="sm" className="w-full gap-1 text-[10px] sm:text-xs h-7 sm:h-8 lg:h-9 px-1.5 sm:px-2">
              <QrCode className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">QR</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(stock)}
            className="flex-1 gap-1 text-[10px] sm:text-xs h-7 sm:h-8 lg:h-9 px-1.5 sm:px-2"
          >
            <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(stock.id)}
            className="text-destructive hover:text-destructive h-7 sm:h-8 lg:h-9 w-7 sm:w-8 lg:w-9 p-0"
          >
            <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

