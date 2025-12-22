'use client';

import { useEffect, useState } from 'react';
import { getDashboardStats } from '@/app/actions/dashboard';
import { useToast } from '@/hooks/use-toast';
import { Package, ShoppingCart, TrendingUp, DollarSign } from 'lucide-react';

interface DashboardStats {
  totalStockValue: number;
  totalSales: number;
  totalPembelian: number;
  labaKotor: number;
  labaBersih: number;
  totalTransactions: number;
  totalItems: number;
}

export default function DashboardStats() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStockValue: 0,
    totalSales: 0,
    totalPembelian: 0,
    labaKotor: 0,
    labaBersih: 0,
    totalTransactions: 0,
    totalItems: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const result = await getDashboardStats();
      if (result.success && result.stats) {
        setStats(result.stats);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Gagal memuat data dashboard',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Terjadi kesalahan saat memuat data dashboard',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-4 sm:p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-24 mb-2"></div>
            <div className="h-8 bg-muted rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-lg border bg-card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base sm:text-lg font-semibold">Total Stock</h2>
          <Package className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-2xl sm:text-3xl font-bold">
          Rp {stats.totalStockValue.toLocaleString('id-ID')}
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {stats.totalItems} items
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base sm:text-lg font-semibold">Total Penjualan</h2>
          <ShoppingCart className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-2xl sm:text-3xl font-bold">
          Rp {stats.totalSales.toLocaleString('id-ID')}
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {stats.totalTransactions} transaksi
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base sm:text-lg font-semibold">Laba Kotor</h2>
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
          Rp {stats.labaKotor.toLocaleString('id-ID')}
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Penjualan - Pembelian
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base sm:text-lg font-semibold">Laba Bersih</h2>
          <DollarSign className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
          Rp {stats.labaBersih.toLocaleString('id-ID')}
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Laba setelah semua biaya
        </p>
      </div>
    </div>
  );
}

