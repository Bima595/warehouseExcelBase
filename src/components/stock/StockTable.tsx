'use client';

import { Edit, Trash2, QrCode, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StockWithoutDeleted } from '@/lib/stock-db';
import Image from 'next/image';
import Link from 'next/link';

interface StockTableProps {
  stocks: StockWithoutDeleted[];
  onEdit: (stock: StockWithoutDeleted) => void;
  onDelete: (id: string) => void;
}

export default function StockTable({ stocks, onEdit, onDelete }: StockTableProps) {
  if (stocks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Belum ada data stock
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Gambar</th>
            <th className="text-left p-4">Nama Barang</th>
            <th className="text-left p-4">Stock</th>
            <th className="text-left p-4">Harga Beli</th>
            <th className="text-left p-4">Harga Jual</th>
            <th className="text-left p-4">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => (
            <tr key={stock.id} className="border-b hover:bg-accent/50">
              <td className="p-4">
                {stock.gambar ? (
                  <Image
                    src={stock.gambar}
                    alt={stock.namaBarang}
                    width={50}
                    height={50}
                    className="object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </td>
              <td className="p-4 font-medium">{stock.namaBarang}</td>
              <td className="p-4">{stock.stock}</td>
              <td className="p-4">Rp {stock.hargaBeli.toLocaleString('id-ID')}</td>
              <td className="p-4">Rp {stock.hargaJual.toLocaleString('id-ID')}</td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <Link href={`/stock/${stock.id}`}>
                    <Button variant="ghost" size="icon" title="Lihat QR Code">
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(stock)}
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(stock.id)}
                    title="Hapus"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

