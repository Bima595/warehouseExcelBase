'use client';

import StockCard from './StockCard';
import type { StockWithoutDeleted } from '@/lib/stock-db';

interface StockGridProps {
  stocks: StockWithoutDeleted[];
  onEdit: (stock: StockWithoutDeleted) => void;
  onDelete: (id: string) => void;
}

export default function StockGrid({ stocks, onEdit, onDelete }: StockGridProps) {
  if (stocks.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <p className="text-lg font-medium text-muted-foreground">Belum ada data stock</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Klik tombol "Tambah Stock" untuk menambahkan item baru
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 w-full max-w-full">
      {stocks.map((stock) => (
        <StockCard
          key={stock.id}
          stock={stock}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

