import { supabase } from './supabase';

export interface Transaction {
  id: string;
  items: Array<{
    stockId: string;
    namaBarang: string;
    quantity: number;
    hargaJual: number;
    subtotal: number;
  }>;
  total: number;
  metodePembayaran: 'cash' | 'transfer' | 'qris' | 'debit' | 'kredit';
  kasir?: string; // Username kasir yang melakukan transaksi
  invoicePath?: string; // Path ke file invoice
  cancelledAt?: string; // Untuk soft delete/cancel
  createdAt: string;
}

export async function writeTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
  try {
    const createdAt = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        items: transaction.items,
        total: transaction.total,
        metode_pembayaran: transaction.metodePembayaran,
        kasir: transaction.kasir || null,
        invoice_path: transaction.invoicePath || null,
        cancelled_at: null,
        created_at: createdAt,
      })
      .select()
      .single();

    if (error) {
      console.error('Error writing transaction:', error);
      throw new Error(`Gagal menyimpan transaksi ke database: ${error.message}`);
    }

    if (!data) {
      throw new Error('Gagal menyimpan transaksi ke database: tidak ada data yang dikembalikan');
    }

    return {
      id: data.id,
      items: data.items || [],
      total: data.total || 0,
      metodePembayaran: data.metode_pembayaran || 'cash',
      kasir: data.kasir || undefined,
      invoicePath: data.invoice_path || undefined,
      cancelledAt: data.cancelled_at || undefined,
      createdAt: data.created_at || createdAt,
    };
  } catch (error) {
    console.error('Error writing transaction:', error);
    throw error instanceof Error ? error : new Error('Gagal menyimpan transaksi ke database');
  }
}

export async function updateTransaction(id: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>): Promise<Transaction | undefined> {
  try {
    const updateData: Record<string, unknown> = {};

    if (updates.items !== undefined) updateData.items = updates.items;
    if (updates.total !== undefined) updateData.total = updates.total;
    if (updates.metodePembayaran !== undefined) updateData.metode_pembayaran = updates.metodePembayaran;
    if (updates.kasir !== undefined) updateData.kasir = updates.kasir || null;
    if (updates.invoicePath !== undefined) updateData.invoice_path = updates.invoicePath || null;
    if (updates.cancelledAt !== undefined) updateData.cancelled_at = updates.cancelledAt || null;

    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating transaction:', error);
      return undefined;
    }

    if (!data) {
      return undefined;
    }

    return {
      id: data.id,
      items: data.items || [],
      total: data.total || 0,
      metodePembayaran: data.metode_pembayaran || 'cash',
      kasir: data.kasir || undefined,
      invoicePath: data.invoice_path || undefined,
      cancelledAt: data.cancelled_at || undefined,
      createdAt: data.created_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error updating transaction:', error);
    return undefined;
  }
}

export async function readTransactions(): Promise<Transaction[]> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .is('cancelled_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error reading transactions:', error);
      return [];
    }

    return (data || []).map((transaction) => ({
      id: transaction.id,
      items: transaction.items || [],
      total: transaction.total || 0,
      metodePembayaran: transaction.metode_pembayaran || 'cash',
      kasir: transaction.kasir || undefined,
      invoicePath: transaction.invoice_path || undefined,
      cancelledAt: transaction.cancelled_at || undefined,
      createdAt: transaction.created_at || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error reading transactions:', error);
    return [];
  }
}

export async function findTransactionById(id: string): Promise<Transaction | undefined> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .is('cancelled_at', null)
      .single();

    if (error || !data) {
      return undefined;
    }

    return {
      id: data.id,
      items: data.items || [],
      total: data.total || 0,
      metodePembayaran: data.metode_pembayaran || 'cash',
      kasir: data.kasir || undefined,
      invoicePath: data.invoice_path || undefined,
      cancelledAt: data.cancelled_at || undefined,
      createdAt: data.created_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error finding transaction by id:', error);
    return undefined;
  }
}
