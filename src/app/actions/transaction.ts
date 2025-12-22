'use server';

import { writeTransaction, updateTransaction, readTransactions, findTransactionById } from '@/lib/transaction-db';
import { updateStock, findStockById } from '@/lib/stock-db';
import { saveInvoice } from '@/lib/invoice-utils';
import { getAuthUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export interface CheckoutItem {
  stockId: string;
  quantity: number;
}

export async function checkoutAction(
  items: CheckoutItem[],
  metodePembayaran: 'cash' | 'transfer' | 'qris' | 'debit' | 'kredit'
) {
  try {
    if (!items || items.length === 0) {
      return { error: 'Keranjang kosong' };
    }

    if (!metodePembayaran) {
      return { error: 'Metode pembayaran harus dipilih' };
    }

    // Validasi dan hitung total
    const transactionItems = [];
    let total = 0;

    for (const item of items) {
      const stock = findStockById(item.stockId);
      if (!stock) {
        return { error: `Stock dengan ID ${item.stockId} tidak ditemukan` };
      }

      if (stock.stock < item.quantity) {
        return { error: `Stock ${stock.namaBarang} tidak mencukupi. Tersedia: ${stock.stock}, Dibutuhkan: ${item.quantity}` };
      }

      const subtotal = stock.hargaJual * item.quantity;
      total += subtotal;

      transactionItems.push({
        stockId: stock.id,
        namaBarang: stock.namaBarang,
        quantity: item.quantity,
        hargaJual: stock.hargaJual,
        subtotal,
      });
    }

    // Kurangi stock
    for (const item of items) {
      const stock = findStockById(item.stockId);
      if (stock) {
        const newStock = stock.stock - item.quantity;
        updateStock(item.stockId, { stock: newStock });
      }
    }

    // Ambil user yang sedang login untuk kasir
    const currentUser = await getAuthUser();
    const kasirUsername = currentUser?.username || 'Unknown';

    // Simpan transaksi
    const transaction = writeTransaction({
      items: transactionItems,
      total,
      metodePembayaran,
      kasir: kasirUsername,
    });

    // Generate dan save invoice
    let invoicePath: string | undefined;
    try {
      invoicePath = saveInvoice(transaction);
      // Update transaction dengan invoice path
      updateTransaction(transaction.id, { invoicePath });
    } catch (error) {
      console.error('Error generating invoice:', error);
      // Invoice error tidak fatal, transaksi tetap berhasil
    }

    revalidatePath('/cashier');
    revalidatePath('/stock');
    revalidatePath('/history');

    return { success: true, transaction: { ...transaction, invoicePath } };
  } catch (error) {
    console.error('Checkout error:', error);
    return { error: 'Terjadi kesalahan saat checkout' };
  }
}

export async function getTransactionsAction() {
  try {
    const transactions = readTransactions();
    // Sort by createdAt descending (terbaru dulu)
    const sortedTransactions = transactions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    // Convert to plain objects using JSON serialization to avoid serialization issues
    const plainTransactions = JSON.parse(JSON.stringify(sortedTransactions));
    return { success: true, transactions: plainTransactions };
  } catch (error) {
    console.error('Get transactions error:', error);
    return { error: 'Terjadi kesalahan saat mengambil data transaksi' };
  }
}

export async function cancelTransactionAction(transactionId: string) {
  try {
    const transaction = findTransactionById(transactionId);
    
    if (!transaction) {
      return { error: 'Transaksi tidak ditemukan' };
    }

    // Kembalikan stock untuk setiap item
    for (const item of transaction.items) {
      const stock = findStockById(item.stockId);
      if (stock) {
        const newStock = stock.stock + item.quantity;
        updateStock(item.stockId, { stock: newStock });
      }
    }

    // Update transaction dengan status cancelled
    updateTransaction(transactionId, { 
      cancelledAt: new Date().toISOString(),
    });

    revalidatePath('/history');
    revalidatePath('/stock');
    revalidatePath('/cashier');

    return { success: true };
  } catch (error) {
    console.error('Cancel transaction error:', error);
    return { error: 'Terjadi kesalahan saat membatalkan transaksi' };
  }
}
