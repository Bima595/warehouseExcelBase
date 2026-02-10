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

    // Hitung total pembelian (dari items yang terjual)
    // Kita perlu menghitung berdasarkan items yang terjual dan harga beli-nya
    let totalPembelian = 0;
    for (const transaction of transactions) {
      if (transaction.items && Array.isArray(transaction.items)) {
        for (const item of transaction.items) {
          const stock = await findStockById(item.stockId);
          if (stock) {
            // Hitung harga beli untuk quantity yang terjual
            totalPembelian += item.quantity * stock.hargaBeli;
          }
        }
      }
    }

    // Laba kotor = total penjualan - total pembelian (HPP)
    const labaKotor = totalSales - totalPembelian;

    // Laba bersih = laba kotor - biaya operasional
    // Untuk sekarang, kita asumsikan biaya operasional = 10% dari laba kotor
    // Atau bisa disesuaikan dengan kebutuhan bisnis
    const biayaOperasional = labaKotor * 0.1; // 10% dari laba kotor
    const labaBersih = labaKotor - biayaOperasional;

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


