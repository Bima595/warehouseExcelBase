'use server';

import { readStocks } from '@/lib/stock-db';
import { readTransactions } from '@/lib/transaction-db';
import { findStockById } from '@/lib/stock-db';

export async function getDashboardStats() {
  try {
    // Ambil semua stock
    const stocks = await readStocks();
    
    // Hitung total nilai inventory (berdasarkan harga beli)
    const totalStockValue = stocks.reduce((sum, stock) => {
      return sum + (stock.stock * stock.hargaBeli);
    }, 0);

    // Ambil semua transaksi (non-cancelled)
    const transactions = await readTransactions();
    
    // Hitung total penjualan
    const totalSales = transactions.reduce((sum, transaction) => {
      return sum + (transaction.total || 0);
    }, 0);

    // Hitung Omset Hari Ini
    const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
    const dailyTurnover = transactions.reduce((sum, transaction) => {
      const transactionDate = new Date(transaction.createdAt).toISOString().split('T')[0];
      if (transactionDate === today) {
        return sum + (transaction.total || 0);
      }
      return sum;
    }, 0);

    // Hitung total pembelian (HPP) dari items yang terjual
    let totalPembelian = 0;
    for (const transaction of transactions) {
      if (transaction.items && Array.isArray(transaction.items)) {
        for (const item of transaction.items) {
          // Cari stock untuk mendapatkan harga beli saat ini
          // Idealnya harga beli disimpan di transaction history untuk snapshot
          // Tapi karena belum ada, kita pakai harga beli saat ini dari master stock
          const stock = stocks.find(s => s.id === item.stockId);
          if (stock) {
            totalPembelian += item.quantity * stock.hargaBeli;
          }
        }
      }
    }

    // Laba kotor = total penjualan - total pembelian (HPP)
    const labaKotor = totalSales - totalPembelian;

    // Laba bersih = laba kotor - biaya operasional
    // Kita asumsikan biaya operasional = 10% dari laba kotor
    const biayaOperasional = labaKotor * 0.1;
    const labaBersih = labaKotor - biayaOperasional;

    return {
      success: true,
      stats: {
        totalStockValue,
        totalSales,
        dailyTurnover, // New field
        totalPembelian,
        labaKotor,
        labaBersih,
        totalTransactions: transactions.length,
        totalItems: stocks.length,
      },
    };
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return {
      error: 'Terjadi kesalahan saat mengambil data dashboard',
      stats: {
        totalStockValue: 0,
        totalSales: 0,
        dailyTurnover: 0,
        totalPembelian: 0,
        labaKotor: 0,
        labaBersih: 0,
        totalTransactions: 0,
        totalItems: 0,
      },
    };
  }
}


