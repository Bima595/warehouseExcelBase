'use client';

import { useEffect, useState } from 'react';
import { getDashboardStats } from '@/app/actions/dashboard';
import { useToast } from '@/hooks/use-toast';
import { Package, ShoppingCart, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';

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
        toast({ variant: 'destructive', title: 'Error', description: result.error || 'Gagal memuat data dashboard' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Terjadi kesalahan saat memuat data dashboard' });
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: 'Stock Value',
      value: stats.totalStockValue,
      subtitle: `${stats.totalItems} Items Terdaftar`,
      icon: Package,
      color: 'bg-indigo-500',
      trend: '+12%',
      isPositive: true
    },
    {
      title: 'Total Sales',
      value: stats.totalSales,
      subtitle: `${stats.totalTransactions} Transaksi Berhasil`,
      icon: ShoppingCart,
      color: 'bg-emerald-500',
      trend: '+8%',
      isPositive: true
    },
    {
      title: 'Gross Profit',
      value: stats.labaKotor,
      subtitle: 'Sales - Purchase Cost',
      icon: TrendingUp,
      color: 'bg-amber-500',
      trend: '+15%',
      isPositive: true
    },
    {
      title: 'Net Revenue',
      value: stats.labaBersih,
      subtitle: 'Total After Deductions',
      icon: DollarSign,
      color: 'bg-rose-500',
      trend: '-2%',
      isPositive: false
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 rounded-[2.5rem] bg-white dark:bg-slate-900 border-none animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative h-full"
          >
            <div className="h-full bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-all duration-500 border border-slate-100 dark:border-slate-800 flex flex-col justify-between overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity bg-slate-900 dark:bg-white" />
              
              <div className="flex items-center justify-between mb-6">
                <div className={`p-4 rounded-2xl ${card.color} text-white shadow-lg shadow-${card.color.split('-')[1]}-500/20`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${card.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {card.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {card.trend}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {card.title}
                </p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                  Rp {card.value.toLocaleString('id-ID')}
                </h3>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {card.subtitle}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
