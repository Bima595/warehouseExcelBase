'use server';

import { readStocks } from '@/lib/stock-db';
import { readTransactions } from '@/lib/transaction-db';
import { findStockById } from '@/lib/stock-db';

export async function getDashboardStats() {
  try {
    // Ambil semua stock
    const stocks = readStocks();
    
    // Hitung total nilai inventory (berdasarkan harga beli)
    const totalStockValue = stocks.reduce((sum, stock) => {
      return sum + (stock.stock * stock.hargaBeli);
    }, 0);

    // Ambil semua transaksi (non-cancelled)
    const transactions = readTransactions();
    
    // Hitung total penjualan
    const totalSales = transactions.reduce((sum, transaction) => {
      return sum + (transaction.total || 0);
    }, 0);

    // Hitung total pembelian (dari items yang terjual)
    // Kita perlu menghitung berdasarkan items yang terjual dan harga beli-nya
    let totalPembelian = 0;
    transactions.forEach(transaction => {
      if (transaction.items && Array.isArray(transaction.items)) {
        transaction.items.forEach(item => {
          const stock = findStockById(item.stockId);
          if (stock) {
            // Hitung harga beli untuk quantity yang terjual
            totalPembelian += item.quantity * stock.hargaBeli;
          }
        });
      }
    });

    // Laba kotor = total penjualan - total pembelian
    const labaKotor = totalSales - totalPembelian;

    // Laba bersih = laba kotor (untuk sekarang, bisa ditambah potongan lain nanti)
    const labaBersih = labaKotor;

    return {
      success: true,
      stats: {
        totalStockValue,
        totalSales,
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
        totalPembelian: 0,
        labaKotor: 0,
        labaBersih: 0,
        totalTransactions: 0,
        totalItems: 0,
      },
    };
  }
}

