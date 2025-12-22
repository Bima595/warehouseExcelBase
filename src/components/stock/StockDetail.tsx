'use client';

import { QrCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

interface StockDetailProps {
  stock: {
    id: string;
    namaBarang: string;
    stock: number;
    hargaBeli: number;
    hargaJual: number;
    gambar?: string;
    qrCode?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export default function StockDetail({ stock }: StockDetailProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Detail Stock</h1>
        <Link href="/stock">
          <Button variant="outline">Kembali</Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Barang</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stock.gambar && (
              <div className="relative w-full h-64 rounded-lg overflow-hidden">
                <Image
                  src={stock.gambar}
                  alt={stock.namaBarang}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Nama Barang
                </label>
                <p className="text-lg font-semibold">{stock.namaBarang}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Stock
                </label>
                <p className="text-lg">{stock.stock}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Harga Beli
                </label>
                <p className="text-lg">Rp {stock.hargaBeli.toLocaleString('id-ID')}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Harga Jual
                </label>
                <p className="text-lg font-semibold text-primary">
                  Rp {stock.hargaJual.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            {stock.qrCode ? (
              <>
                <div className="relative w-64 h-64">
                  <Image
                    src={stock.qrCode}
                    alt="QR Code"
                    fill
                    className="object-contain"
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Scan QR code ini untuk melihat detail barang
                </p>
              </>
            ) : (
              <div className="text-center text-muted-foreground">
                <QrCode className="h-16 w-16 mx-auto mb-2 opacity-50" />
                <p>QR Code tidak tersedia</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

